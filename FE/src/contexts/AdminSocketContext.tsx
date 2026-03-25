"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";

interface Notification {
  _id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

interface AdminSocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  newNotification: Notification | null;
  clearNewNotification: () => void;
}

const AdminSocketContext = createContext<AdminSocketContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Singleton stored on `window` — survives Next.js HMR module re-evaluation.
// ---------------------------------------------------------------------------
const ADMIN_SOCKET_KEY = "__app_admin_socket__" as const;

const getGlobalAdminSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;
  return (window as any)[ADMIN_SOCKET_KEY] ?? null;
};

const setGlobalAdminSocket = (s: Socket | null) => {
  if (typeof window === "undefined") return;
  if (s) {
    (window as any)[ADMIN_SOCKET_KEY] = s;
  } else {
    delete (window as any)[ADMIN_SOCKET_KEY];
  }
};

// Flag so SocketProvider knows admin is active and skips candidate/company socket.
const ADMIN_ACTIVE_KEY = "__admin_socket_active__" as const;

export function AdminSocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  // ── Helper: attach / re-attach event listeners ──────────────────────────
  const attachListeners = useCallback((s: Socket) => {
    s.off("connect").on("connect", () => {
      console.log(`[AdminSocket] Connected | sid: ${s.id}`);
      setIsConnected(true);
    });
    s.off("disconnect").on("disconnect", (reason: string) => {
      console.log("[AdminSocket] Disconnected | reason:", reason);
      setIsConnected(false);
    });
    s.off("connect_error").on("connect_error", (err: Error) => {
      console.log("[AdminSocket] Connection error:", err.message);
      setIsConnected(false);
    });
    s.off("new_notification").on("new_notification", (n: Notification) => {
      console.log("[AdminSocket] New notification received");
      setNewNotification(n);
    });
  }, []);

  // ── Helper: create or reuse socket ──────────────────────────────────────
  const ensureSocket = useCallback(() => {
    const existing = getGlobalAdminSocket();

    if (existing?.active) {
      console.log("[AdminSocket] ensureSocket: RE-USING existing singleton");
      attachListeners(existing);
      setSocket(existing);
      setIsConnected(existing.connected);
      return;
    }

    if (existing) {
      console.log("[AdminSocket] ensureSocket: DISCARDING stale socket");
      existing.removeAllListeners();
      existing.disconnect();
      setGlobalAdminSocket(null);
    }

    console.log("[AdminSocket] Creating new socket");
    const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001", {
      withCredentials: true,
      transports: ["websocket"],
      query: { isAdmin: "true" },
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 100,
      timeout: 20000,
    });

    setGlobalAdminSocket(s);
    attachListeners(s);
    setSocket(s);
  }, [attachListeners]);

  // ── Effect: Sync local React state to window singleton on mount ──────────
  useEffect(() => {
    const existing = getGlobalAdminSocket();
    if (existing?.active) {
      setSocket(existing);
      setIsConnected(existing.connected);
      attachListeners(existing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect: Connect on mount, clean up on unload ─────────────────────────
  // 50ms delay lets React 18 Strict Mode complete setup→cleanup→setup before
  // creating the socket (same pattern as SocketProvider for candidate/company).
  const hasMounted = useRef(false);
  useEffect(() => {
    const handleBeforeUnload = () => {
      const existing = getGlobalAdminSocket();
      if (existing) {
        existing.removeAllListeners();
        existing.disconnect();
        setGlobalAdminSocket(null);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    // Signal SocketProvider to skip candidate/company socket while admin is active
    (window as any)[ADMIN_ACTIVE_KEY] = true;

    const timer = setTimeout(() => {
      if (!hasMounted.current) {
        hasMounted.current = true;
        ensureSocket();
      }
    }, 50);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      delete (window as any)[ADMIN_ACTIVE_KEY];
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  return (
    <AdminSocketContext.Provider value={{ socket, isConnected, newNotification, clearNewNotification }}>
      {children}
    </AdminSocketContext.Provider>
  );
}

export const useAdminSocketContext = (): AdminSocketContextValue => {
  const context = useContext(AdminSocketContext);
  if (context === undefined) {
    throw new Error("useAdminSocketContext must be used within AdminSocketProvider");
  }
  return context;
};
