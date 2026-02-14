import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";
import { rateLimitConfig } from "../config/variable";

let io: SocketIOServer | null = null;

// Map userId to many socketIds (supports multiple tabs/devices per user)
const userSockets = new Map<string, Set<string>>();
const companySockets = new Map<string, Set<string>>();
const socketAuthAttempts = new Map<string, { count: number; resetAt: number }>();
const SOCKET_AUTH_WINDOW_MS = 60_000;
const SOCKET_AUTH_MAX_ATTEMPTS = rateLimitConfig.socketAuth.maxPerMinute;

const pruneExpiredAuthAttempts = (now: number) => {
  if (socketAuthAttempts.size < 200) return;
  for (const [ip, state] of socketAuthAttempts.entries()) {
    if (now >= state.resetAt) {
      socketAuthAttempts.delete(ip);
    }
  }
};

// Simple cookie parser (to avoid external dependency)
const parseCookies = (cookieHeader: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name) {
      cookies[name.trim()] = decodeURIComponent(rest.join('=').trim());
    }
  });
  return cookies;
};

/**
 * Initialize Socket.IO server
 */
export const initializeSocket = (httpServer: HTTPServer, allowedOrigins: string[]) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const ip = socket.handshake.address || "unknown";
      const now = Date.now();
      pruneExpiredAuthAttempts(now);
      const authState = socketAuthAttempts.get(ip);
      if (!authState || now >= authState.resetAt) {
        socketAuthAttempts.set(ip, { count: 1, resetAt: now + SOCKET_AUTH_WINDOW_MS });
      } else {
        authState.count += 1;
        if (authState.count > SOCKET_AUTH_MAX_ATTEMPTS) {
          return next(new Error("Too many socket auth attempts"));
        }
      }

      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error("No cookies"));
      }

      const parsedCookies = parseCookies(cookies);
      const token = parsedCookies.token;

      if (!token) {
        return next(new Error("No token"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET || "") as any;
      socket.data.userId = decoded.id;
      
      // Detect role by checking which collection the user exists in
      const candidate = await AccountCandidate.findById(decoded.id);
      if (candidate) {
        socket.data.role = "candidate";
      } else {
        const company = await AccountCompany.findById(decoded.id);
        if (company) {
          socket.data.role = "company";
        } else {
          return next(new Error("User not found"));
        }
      }
      
      next();
    } catch (error) {
      console.log("[Socket] Auth error:", error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId, role } = socket.data;
    
    console.log(`[Socket] User connected: ${userId} (${role})`);

    // Store socket mapping based on role
    if (role === "candidate") {
      const sockets = userSockets.get(userId) || new Set<string>();
      sockets.add(socket.id);
      userSockets.set(userId, sockets);
    } else if (role === "company") {
      const sockets = companySockets.get(userId) || new Set<string>();
      sockets.add(socket.id);
      companySockets.set(userId, sockets);
    }

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      if (role === "candidate") {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) userSockets.delete(userId);
        }
      } else {
        const sockets = companySockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) companySockets.delete(userId);
        }
      }
    });
  });

  console.log("[Socket] Socket.IO server initialized");
  return io;
};

/**
 * Get Socket.IO server instance
 */
export const getIO = (): SocketIOServer | null => io;

/**
 * Send notification to a specific candidate
 */
export const notifyCandidate = (candidateId: string, notification: any) => {
  if (!io) {
    console.log(`[Socket] Cannot notify - Socket.IO not initialized`);
    return;
  }
  const socketServer = io;
  
  const socketIds = userSockets.get(candidateId);
  console.log(`[Socket] Looking for candidate ${candidateId}, found sockets: ${socketIds?.size || 0}`);
  console.log(`[Socket] Current connected candidates: ${Array.from(userSockets.keys()).join(', ') || 'none'}`);
  
  if (socketIds && socketIds.size > 0) {
    socketIds.forEach((socketId) => socketServer.to(socketId).emit("new_notification", notification));
    console.log(`[Socket] Notification sent to candidate: ${candidateId}`);
  } else {
    console.log(`[Socket] Candidate ${candidateId} not connected - notification will be fetched on next page load`);
  }
};

/**
 * Send notification to a specific company
 */
export const notifyCompany = (companyId: string, notification: any) => {
  if (!io) return;
  const socketServer = io;
  
  const socketIds = companySockets.get(companyId);
  if (socketIds && socketIds.size > 0) {
    socketIds.forEach((socketId) => socketServer.to(socketId).emit("new_notification", notification));
    console.log(`[Socket] Notification sent to company: ${companyId}`);
  }
};

export const closeSocketServer = async () => {
  if (!io) return;
  await io.close();
  io = null;
  userSockets.clear();
  companySockets.clear();
};
