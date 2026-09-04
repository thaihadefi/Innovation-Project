import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import { Types } from "mongoose";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";
import AccountAdmin from "../models/account-admin.model";
import { rateLimitConfig } from "../config/variable";
import { verifyAuthToken, AuthTokenPayload } from "./jwt.helper";
import { IAccountAdmin } from "../interfaces/models/account-admin.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { IAccountCompany } from "../interfaces/models/account-company.interface";
import { INotification, INotificationData, NotificationType } from "../interfaces/models/notification.interface";

export interface SocketNotificationDTO {
  _id?: Types.ObjectId | string;
  candidateId?: Types.ObjectId | string;
  companyId?: Types.ObjectId | string;
  adminId?: Types.ObjectId | string;
  type?: NotificationType;
  title: string;
  message?: string;
  link?: string;
  read?: boolean;
  data?: INotificationData;
  createdAt?: Date | string;
  updatedAt?: Date | string;
}

export type SocketNotificationPayload = INotification | SocketNotificationDTO;

interface CustomSocketData {
  userId: string;
  role: "candidate" | "company" | "admin";
}

let io: SocketIOServer | null = null;

const userSockets = new Map<string, Set<string>>();
const companySockets = new Map<string, Set<string>>();
const adminSockets = new Map<string, Set<string>>();
const socketAuthAttempts = new Map<string, { count: number; resetAt: number }>();
const SOCKET_AUTH_WINDOW_MS = 60_000;
const SOCKET_AUTH_MAX_ATTEMPTS = rateLimitConfig.socketAuth.maxPerMinute;

const pruneExpiredAuthAttempts = (now: number): void => {
  if (socketAuthAttempts.size < 200) return;
  for (const [ip, state] of socketAuthAttempts.entries()) {
    if (now >= state.resetAt) {
      socketAuthAttempts.delete(ip);
    }
  }
};

const parseCookies = (cookieHeader: string): Record<string, string> => {
  const cookies: Record<string, string> = {};
  cookieHeader.split(";").forEach((cookie) => {
    const [name, ...rest] = cookie.split("=");
    if (name) {
      cookies[name.trim()] = decodeURIComponent(rest.join("=").trim());
    }
  });
  return cookies;
};

export const initializeSocket = (
  httpServer: HTTPServer,
  corsOrigin: boolean | string | string[]
): SocketIOServer => {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: corsOrigin,
      credentials: true,
    },
    maxHttpBufferSize: 1e7,
    allowUpgrades: true,
    transports: ["websocket", "polling"],
    pingInterval: 30000,
    pingTimeout: 60000,
  });

  io.use(async (socket: Socket, next: (err?: Error) => void) => {
    try {
      const forwarded = socket.handshake.headers["x-forwarded-for"];
      const ip =
        (typeof forwarded === "string" ? forwarded.split(",")[0].trim() : socket.handshake.address) ||
        "unknown";
      const now = Date.now();
      pruneExpiredAuthAttempts(now);
      const authState = socketAuthAttempts.get(ip);
      if (!authState || now >= authState.resetAt) {
        socketAuthAttempts.set(ip, { count: 1, resetAt: now + SOCKET_AUTH_WINDOW_MS });
      } else if (authState.count >= SOCKET_AUTH_MAX_ATTEMPTS) {
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

      if (adminToken) {
        const decodedAdmin = verifyAuthToken<AuthTokenPayload>(adminToken);
        if (decodedAdmin && decodedAdmin.id && decodedAdmin.role === "admin") {
          const admin = await AccountAdmin.findById(decodedAdmin.id)
            .select("_id status")
            .lean<IAccountAdmin>();
          if (admin) {
            if (admin.status !== "active") {
              return next(new Error("Account is not active"));
            }
            socket.data.userId = decodedAdmin.id;
            socket.data.role = "admin";
            return next();
          }
        }
      }

      if (!token) {
        return next(new Error("No valid token"));
      }

      const decoded = verifyAuthToken<AuthTokenPayload>(token);
      if (!decoded || !decoded.id) {
        return next(new Error("Invalid token payload"));
      }
      socket.data.userId = decoded.id;

      if (decoded.role === "candidate" || decoded.role === "company") {
        const account =
          decoded.role === "candidate"
            ? await AccountCandidate.findById(decoded.id).select("status").lean<IAccountCandidate>()
            : await AccountCompany.findById(decoded.id).select("status").lean<IAccountCompany>();

        if (!account || account.status !== "active") {
          return next(new Error("Account is not active"));
        }
        socket.data.role = decoded.role;
        return next();
      }

      const candidate = await AccountCandidate.findById(decoded.id)
        .select("_id status")
        .lean<IAccountCandidate>();
      if (candidate) {
        if (candidate.status !== "active") {
          return next(new Error("Account is not active"));
        }
        socket.data.role = "candidate";
      } else {
        const company = await AccountCompany.findById(decoded.id)
          .select("_id status")
          .lean<IAccountCompany>();
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
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.log("[Socket] Auth error:", err?.message || error);
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const { userId, role } = socket.data as CustomSocketData;

    console.log(`[Socket] User connected: ${userId} (${role}) | transport: ${socket.conn.transport.name} | sid: ${socket.id}`);

    socket.conn.on("upgrade", (transport: { name: string }) => {
      console.log(`[Socket] Transport upgraded: ${userId} → ${transport.name}`);
    });

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

export const getIO = (): SocketIOServer | null => io;

export const sendSocketNotification = (
  role: "candidate" | "company" | "admin",
  recipientId: string,
  notification: SocketNotificationPayload
): void => {
  if (!io) return;
  const socketMap = role === "candidate" ? userSockets : (role === "company" ? companySockets : adminSockets);
  const socketIds = socketMap.get(recipientId);

  if (socketIds && socketIds.size > 0) {
    socketIds.forEach((socketId) => io!.to(socketId).emit("new_notification", notification));
  }
};

export const notifyCandidate = (candidateId: string, notification: SocketNotificationPayload): void => {
  sendSocketNotification("candidate", candidateId, notification);
};

export const notifyCompany = (companyId: string, notification: SocketNotificationPayload): void => {
  sendSocketNotification("company", companyId, notification);
};

export const notifyAdmin = (adminId: string, notification: SocketNotificationPayload): void => {
  sendSocketNotification("admin", adminId, notification);
};

export const closeSocketServer = async (): Promise<void> => {
  if (!io) return;
  await io.close();
  io = null;
  userSockets.clear();
  companySockets.clear();
  adminSockets.clear();
};
