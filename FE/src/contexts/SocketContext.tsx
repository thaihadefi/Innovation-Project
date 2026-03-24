"use client";
import { createContext, useContext, useEffect, useRef, useState, useCallback, ReactNode } from "react";
import { io, Socket } from "socket.io-client";
import { useAuthContext } from "./AuthContext";

interface Notification {
  _id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

interface SocketContextValue {
  socket: Socket | null;
  isConnected: boolean;
  newNotification: Notification | null;
  clearNewNotification: () => void;
}

const SocketContext = createContext<SocketContextValue | undefined>(undefined);

// ---------------------------------------------------------------------------
// Singleton stored on `window` — survives Next.js HMR module re-evaluation.
// ---------------------------------------------------------------------------
const SOCKET_KEY = "__app_socket__" as const;

const getGlobalSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;
  return (window as any)[SOCKET_KEY] ?? null;
};

const setGlobalSocket = (s: Socket | null) => {
  if (typeof window === "undefined") return;
  if (s) {
    (window as any)[SOCKET_KEY] = s;
  } else {
    delete (window as any)[SOCKET_KEY];
  }
};

/**
 * Singleton socket provider — one connection for the entire app lifetime.
 *
 * Two separate effects:
 *   1. **Connect effect** (runs once on mount) — creates the socket if the user
 *      is already logged in. Does NOT depend on `isLogin`, so it never re-fires
 *      when auth state resolves from false → true on mount.
 *   2. **Login-watcher effect** (depends on `isLogin`) — handles logout (disconnect)
 *      and late login (connect if socket doesn't exist yet).
 *
 * Both share the `window.__app_socket__` singleton to prevent duplicates.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { isLogin } = useAuthContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const isLoginRef = useRef(isLogin);
  isLoginRef.current = isLogin;

  // ── Helper: attach / re-attach event listeners ──────────────────────────
  const attachListeners = useCallback((s: Socket) => {
    s.off("connect").on("connect", () => {
      console.log("[Socket] Connected:", s.id);
      setIsConnected(true);
    });
    s.off("disconnect").on("disconnect", (reason: string) => {
      console.log("[Socket] Disconnected:", reason);
      setIsConnected(false);
    });
    s.off("connect_error").on("connect_error", (err: Error) => {
      console.log("[Socket] Connection error:", err.message);
      setIsConnected(false);
    });
    s.off("new_notification").on("new_notification", (n: Notification) => {
      console.log("[Socket] New notification:", n);
      setNewNotification(n);
    });
  }, []);

  // ── Helper: create a brand-new socket ───────────────────────────────────
  const ensureSocket = useCallback(() => {
    const existing = getGlobalSocket();

    // Already have a live socket → reuse (re-attach listeners for fresh closures)
    if (existing?.active) {
      attachListeners(existing);
      setSocket(existing);
      setIsConnected(existing.connected);
      return;
    }

    // Discard dead socket
    if (existing) {
      existing.removeAllListeners();
      existing.disconnect();
      setGlobalSocket(null);
    }

    const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001", {
      withCredentials: true,
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 50,
      timeout: 15000,
    });

    setGlobalSocket(s);
    attachListeners(s);
    setSocket(s);
  }, [attachListeners]);

  // ── Helper: tear down the socket ────────────────────────────────────────
  const destroySocket = useCallback(() => {
    const existing = getGlobalSocket();
    if (existing) {
      existing.removeAllListeners();
      existing.disconnect();
      setGlobalSocket(null);
    }
    setSocket(null);
    setIsConnected(false);
  }, []);

  // ── Effect 1: one-time mount — connect if user is already logged in ─────
  // Runs ONCE. No dependency on `isLogin`, so auth resolving (false→true) on
  // mount does NOT re-trigger this – preventing the double-run timing issue.
  useEffect(() => {
    if (isLoginRef.current) {
      ensureSocket();
    }
    // No cleanup — socket lifecycle managed by Effect 2.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 2: react to login-state changes ──────────────────────────────
  // Handles late login (user logs in after initial mount) and logout.
  // Skips the very first render via a "mounted" flag so it doesn't race
  // with Effect 1.
  const hasMounted = useRef(false);

  useEffect(() => {
    if (!hasMounted.current) {
      hasMounted.current = true;
      return; // Effect 1 already handled the initial mount
    }

    if (isLogin) {
      ensureSocket();
    } else {
      destroySocket();
    }
  }, [isLogin, ensureSocket, destroySocket]);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  return (
    <SocketContext.Provider value={{ socket, isConnected, newNotification, clearNewNotification }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocketContext = (): SocketContextValue => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocketContext must be used within SocketProvider");
  }
  return context;
};
