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
const SOCKET_USER_KEY = "__app_socket_user_id__" as const;

const getGlobalSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;
  return (window as any)[SOCKET_KEY] ?? null;
};

const getGlobalSocketUserId = (): string | null => {
  if (typeof window === "undefined") return null;
  return (window as any)[SOCKET_USER_KEY] ?? null;
};

const setGlobalSocket = (s: Socket | null, userId: string | null) => {
  if (typeof window === "undefined") return;
  if (s) {
    (window as any)[SOCKET_KEY] = s;
    (window as any)[SOCKET_USER_KEY] = userId;
  } else {
    delete (window as any)[SOCKET_KEY];
    delete (window as any)[SOCKET_USER_KEY];
  }
};

export function SocketProvider({ children }: { children: ReactNode }) {
  const { isLogin, infoCandidate, infoCompany } = useAuthContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  
  const currentUserId = infoCandidate?.id || infoCandidate?._id || infoCompany?.id || infoCompany?._id || null;
  // Keep userId in a ref so ensureSocket never needs it as a useCallback dep.
  // This prevents the loop: userId changes → ensureSocket recreates → lifecycle effect fires → disconnect/reconnect.
  const currentUserIdRef = useRef(currentUserId);
  currentUserIdRef.current = currentUserId;
  const isLoginRef = useRef(isLogin);
  isLoginRef.current = isLogin;

  // ── Helper: attach / re-attach event listeners ──────────────────────────
  const attachListeners = useCallback((s: Socket) => {
    s.off("connect").on("connect", () => {
      console.log(`[Socket] Connected | sid: ${s.id} | transport: ${s.io.engine.transport.name}`);
      if (s.io.engine.transport.name !== "websocket") {
        console.warn("[Socket] WARNING: Not using websocket transport!");
      }
      setIsConnected(true);
    });
    s.off("disconnect").on("disconnect", (reason: string) => {
      console.log("[Socket] Disconnected | reason:", reason);
      setIsConnected(false);
    });
    s.off("connect_error").on("connect_error", (err: Error) => {
      console.log("[Socket] Connection error:", err.message);
      setIsConnected(false);
    });
    s.off("new_notification").on("new_notification", (n: Notification) => {
      console.log("[Socket] New notification received");
      setNewNotification(n);
    });
  }, []);

  // ── Helper: create a brand-new socket ───────────────────────────────────
  // Uses currentUserIdRef (not currentUserId state) — stable callback, no lifecycle churn.
  const ensureSocket = useCallback(() => {
    const existing = getGlobalSocket();
    const existingUserId = getGlobalSocketUserId();
    const userId = currentUserIdRef.current;

    // Already have a live socket for the SAME user → reuse
    if (existing?.active && existingUserId === userId) {
      console.log("[Socket] ensureSocket: RE-USING existing singleton for", userId);
      attachListeners(existing);
      setSocket(existing);
      setIsConnected(existing.connected);
      return;
    }

    // Identity changed or socket dead → discard old one
    if (existing) {
      const reason = !existing.active ? "socket dead" : `identity mismatch (${existingUserId} -> ${userId})`;
      console.log("[Socket] ensureSocket: DISCARDING existing singleton. Reason:", reason);
      existing.removeAllListeners();
      existing.disconnect();
      setGlobalSocket(null, null);
    }

    console.log("[Socket] Creating new socket for user:", userId);
    const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001", {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 100,
      timeout: 20000,
    });

    setGlobalSocket(s, userId);
    attachListeners(s);
    setSocket(s);
  }, [attachListeners]); // No currentUserId dep — ref keeps it current without causing re-creation

  // ── Helper: tear down the socket ────────────────────────────────────────
  const destroySocket = useCallback(() => {
    const existing = getGlobalSocket();
    if (existing) {
      existing.removeAllListeners();
      existing.disconnect();
      setGlobalSocket(null, null);
    }
    setSocket(null);
    setIsConnected(false);
  }, []);

  // ── Effect 1: Sync local React state to the window singleton on mount.
  // Runs once — no deps that change after mount.
  useEffect(() => {
    const existing = getGlobalSocket();
    if (existing && existing.active && getGlobalSocketUserId() === currentUserIdRef.current) {
      setSocket(existing);
      setIsConnected(existing.connected);
      attachListeners(existing);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Effect 2: Life-cycle watcher
  const hasMounted = useRef(false);
  useEffect(() => {
    // Gracefully handle full page reloads to prevent "transport close" on server
    const handleBeforeUnload = () => {
      destroySocket();
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    // Use a small delay to allow hydration and React 18 Strict Mode to settle
    // This prevents the "4x connection" churn during development
    const timer = setTimeout(() => {
      if (!hasMounted.current) {
        hasMounted.current = true;
        // Skip if admin session is active — AdminSocketProvider handles its own socket
        const adminActive = typeof window !== "undefined" && !!(window as any).__admin_socket_active__;
        if (isLoginRef.current && currentUserIdRef.current && !adminActive) ensureSocket();
      } else {
        const adminActive = typeof window !== "undefined" && !!(window as any).__admin_socket_active__;
        if (isLogin && currentUserId && !adminActive) {
          ensureSocket();
        } else {
          destroySocket();
        }
      }
    }, 50);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimeout(timer);
    };
  }, [isLogin, currentUserId, ensureSocket, destroySocket]);

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
