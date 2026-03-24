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
  console.log("%c [Socket] PROVIDER MOUNTED V4 ", "background: #3b82f6; color: white; padding: 2px; border-radius: 2px;");
  const { isLogin, infoCandidate, infoCompany } = useAuthContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  
  const currentUserId = infoCandidate?.id || infoCandidate?._id || infoCompany?.id || infoCompany?._id || null;
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
  const ensureSocket = useCallback(() => {
    const existing = getGlobalSocket();
    const existingUserId = getGlobalSocketUserId();

    // Already have a live socket for the SAME user → reuse
    if (existing?.active && existingUserId === currentUserId) {
      console.log("[Socket] ensureSocket: RE-USING existing singleton for", currentUserId);
      attachListeners(existing);
      setSocket(existing);
      setIsConnected(existing.connected);
      return;
    }

    // Identitity changed or socket dead → Discard old one
    if (existing) {
      const reason = !existing.active ? "socket dead" : `identity mismatch (${existingUserId} -> ${currentUserId})`;
      console.log("[Socket] ensureSocket: DISCARDING existing singleton. Reason:", reason);
      existing.removeAllListeners();
      existing.disconnect();
      setGlobalSocket(null, null);
    }

    console.log("%c [Socket] ENGINE V5 - CREATING NEW SOCKET ", "background: #22c55e; color: white; padding: 4px; border-radius: 4px; font-weight: bold;");
    const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001", {
      withCredentials: true,
      transports: ["websocket"],
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 100,
      timeout: 20000,
    });

    setGlobalSocket(s, currentUserId);
    attachListeners(s);
    setSocket(s);
  }, [attachListeners, currentUserId]);

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

  // ── Effect 1: Sync local state to singleton on build
  useEffect(() => {
    const existing = getGlobalSocket();
    if (existing && existing.active && getGlobalSocketUserId() === currentUserId) {
      setSocket(existing);
      setIsConnected(existing.connected);
      attachListeners(existing);
    }
  }, [currentUserId, attachListeners]);

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
        if (isLoginRef.current) ensureSocket();
      } else {
        if (isLogin) {
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
