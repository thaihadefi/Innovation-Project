import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";

let io: SocketIOServer | null = null;

// Map userId to socketId for direct messaging
const userSockets = new Map<string, string>();
const companySockets = new Map<string, string>();

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
export const initializeSocket = (httpServer: HTTPServer) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.DOMAIN_FRONTEND,
      credentials: true
    }
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
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
      userSockets.set(userId, socket.id);
    } else if (role === "company") {
      companySockets.set(userId, socket.id);
    }

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`[Socket] User disconnected: ${userId}`);
      if (role === "candidate") {
        userSockets.delete(userId);
      } else {
        companySockets.delete(userId);
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
  
  const socketId = userSockets.get(candidateId);
  console.log(`[Socket] Looking for candidate ${candidateId}, found socket: ${socketId || 'NOT FOUND'}`);
  console.log(`[Socket] Current connected candidates: ${Array.from(userSockets.keys()).join(', ') || 'none'}`);
  
  if (socketId) {
    io.to(socketId).emit("new_notification", notification);
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
  
  const socketId = companySockets.get(companyId);
  if (socketId) {
    io.to(socketId).emit("new_notification", notification);
    console.log(`[Socket] Notification sent to company: ${companyId}`);
  }
};
