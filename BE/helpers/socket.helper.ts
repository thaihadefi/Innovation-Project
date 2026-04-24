import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import jwt from "jsonwebtoken";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";
import AccountAdmin from "../models/account-admin.model";
import { rateLimitConfig } from "../config/variable";

let io: SocketIOServer | null = null;
type SocketTokenPayload = jwt.JwtPayload & { id?: string; role?: string };

// Map userId to many socketIds (supports multiple tabs/devices per user)
const userSockets = new Map<string, Set<string>>();
const companySockets = new Map<string, Set<string>>();
const adminSockets = new Map<string, Set<string>>();
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
export const initializeSocket = (httpServer: HTTPServer, corsOrigin: boolean | string | string[]) => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true
    },
    // Support large notification payloads (e.g. CV files or detailed logs)
    maxHttpBufferSize: 1e7, // 10MB
    allowUpgrades: true,
    transports: ["websocket", "polling"],
    // Increase tolerance for navigation-induced polling interruptions
    pingInterval: 30000,
    pingTimeout: 60000,
  });

  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      // Extract real client IP — trust first entry in x-forwarded-for (Nginx sets this)
      // Fallback to handshake.address for direct connections (dev/testing)
      const forwarded = socket.handshake.headers["x-forwarded-for"];
      const ip = (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : socket.handshake.address) || "unknown";
      const now = Date.now();
      pruneExpiredAuthAttempts(now);
      const authState = socketAuthAttempts.get(ip);
      if (!authState || now >= authState.resetAt) {
        socketAuthAttempts.set(ip, { count: 1, resetAt: now + SOCKET_AUTH_WINDOW_MS });
      } else if (authState.count >= SOCKET_AUTH_MAX_ATTEMPTS) {
        // Check before incrementing so the limit is exact (not MAX+1)
        return next(new Error("Too many socket auth attempts"));
      } else {
        authState.count += 1;
      }

      const cookies = socket.handshake.headers.cookie;
      if (!cookies) {
        return next(new Error("No cookies"));
      }

      const parsedCookies = parseCookies(cookies);
      const token = parsedCookies.token;
      const adminToken = parsedCookies.adminToken;

      if (!token && !adminToken) {
        return next(new Error("No token"));
      }

      // Derive admin intent from the token payload itself — never trust client query params.
      // If adminToken decodes to role="admin", treat as admin connection regardless of query string.
      if (adminToken) {
        try {
          const jwtSecret = process.env.JWT_SECRET;
          if (!jwtSecret) throw new Error("JWT_SECRET not configured");
          const decoded = jwt.verify(adminToken, jwtSecret) as SocketTokenPayload;
          if (decoded.id && decoded.role === "admin") {
            const admin = await AccountAdmin.findById(decoded.id).select("_id status").lean();
            if (admin) {
              if ((admin as any).status !== "active") {
                return next(new Error("Account is not active"));
              }
              socket.data.userId = decoded.id;
              socket.data.role = "admin";
              return next();
            }
          }
        } catch {
          // adminToken invalid or not an admin token, fall through to candidate/company token
        }
      }

      if (!token) {
        return next(new Error("No valid token"));
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) throw new Error("JWT_SECRET not configured");
      const decoded = jwt.verify(token, jwtSecret) as SocketTokenPayload;
      if (!decoded.id) {
        return next(new Error("Invalid token payload"));
      }
      socket.data.userId = decoded.id;

      // Fast path: role in JWT -> query only the right collection 
      if (decoded.role === "candidate" || decoded.role === "company") {
        const account = decoded.role === "candidate"
          ? await AccountCandidate.findById(decoded.id).select("status").lean()
          : await AccountCompany.findById(decoded.id).select("status").lean();
        if (!account || (account as any).status !== "active") {
          return next(new Error("Account is not active"));
        }
        socket.data.role = decoded.role;
        return next();
      }

      // Fallback: detect role via DB (legacy tokens without role field)
      const candidate = await AccountCandidate.findById(decoded.id)
        .select("_id status")
        .lean();
      if (candidate) {
        if (candidate.status !== "active") {
          return next(new Error("Account is not active"));
        }
        socket.data.role = "candidate";
      } else {
        const company = await AccountCompany.findById(decoded.id)
          .select("_id status")
          .lean();
        if (company) {
          if (company.status !== "active") {
            return next(new Error("Account is not active"));
          }
          socket.data.role = "company";
        } else {
          return next(new Error("User not found"));
        }
      }

      next();
    } catch (error: any) {
      // Log message only (avoid stack trace noise for expected errors like expired sessions)
      console.log("[Socket] Auth error:", error?.message || error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId, role } = socket.data;
    
    console.log(`[Socket] User connected: ${userId} (${role}) | transport: ${socket.conn.transport.name} | sid: ${socket.id}`);

    // Log transport upgrades (polling → websocket)
    socket.conn.on("upgrade", (transport: any) => {
      console.log(`[Socket] Transport upgraded: ${userId} → ${transport.name}`);
    });

    // Store socket mapping based on role
    if (role === "candidate") {
      const sockets = userSockets.get(userId) || new Set<string>();
      sockets.add(socket.id);
      userSockets.set(userId, sockets);
    } else if (role === "company") {
      const sockets = companySockets.get(userId) || new Set<string>();
      sockets.add(socket.id);
      companySockets.set(userId, sockets);
    } else if (role === "admin") {
      const sockets = adminSockets.get(userId) || new Set<string>();
      sockets.add(socket.id);
      adminSockets.set(userId, sockets);
    }

    // Handle disconnection
    socket.on("disconnect", (reason: string) => {
      console.log(`[Socket] User disconnected: ${userId} | reason: ${reason} | sid: ${socket.id}`);
      if (role === "candidate") {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) userSockets.delete(userId);
        }
      } else if (role === "company") {
        const sockets = companySockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) companySockets.delete(userId);
        }
      } else if (role === "admin") {
        const sockets = adminSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) adminSockets.delete(userId);
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

/**
 * Send notification to a specific admin
 */
export const notifyAdmin = (adminId: string, notification: any) => {
  if (!io) return;
  const socketServer = io;

  const socketIds = adminSockets.get(adminId);
  if (socketIds && socketIds.size > 0) {
    socketIds.forEach((socketId) => socketServer.to(socketId).emit("new_notification", notification));
    console.log(`[Socket] Notification sent to admin: ${adminId}`);
  }
};

export const closeSocketServer = async () => {
  if (!io) return;
  await io.close();
  io = null;
  userSockets.clear();
  companySockets.clear();
  adminSockets.clear();
};
