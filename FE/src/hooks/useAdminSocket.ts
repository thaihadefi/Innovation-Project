"use client";
import { useEffect, useState, useCallback, useRef } from "react";
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

interface UseAdminSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  newNotification: Notification | null;
  clearNewNotification: () => void;
}

// Store on `window` so the instance survives Next.js HMR in dev mode.
const ADMIN_SOCKET_KEY = "__app_admin_socket__" as const;

const getAdminSocket = (): Socket | null => {
  if (typeof window === "undefined") return null;
  return (window as any)[ADMIN_SOCKET_KEY] ?? null;
};

const setAdminSocket = (s: Socket | null) => {
  if (typeof window === "undefined") return;
  if (s) {
    (window as any)[ADMIN_SOCKET_KEY] = s;
  } else {
    delete (window as any)[ADMIN_SOCKET_KEY];
  }
};

/**
 * Custom hook for Socket.IO real-time notifications (admin).
 * Always connects — admin layout already verifies auth.
 */
export const useAdminSocket = (): UseAdminSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const mountedRef = useRef(true);

  // ── Helper: attach / re-attach event listeners ──────────────────────────
  const attachListeners = useCallback((s: Socket) => {
    s.off("connect").on("connect", () => {
      console.log("[AdminSocket] Connected:", s.id);
      if (mountedRef.current) setIsConnected(true);
    });
    s.off("disconnect").on("disconnect", (reason: string) => {
      console.log("[AdminSocket] Disconnected:", reason);
      if (mountedRef.current) setIsConnected(false);
    });
    s.off("connect_error").on("connect_error", (error: Error) => {
      console.log("[AdminSocket] Connection error:", error.message);
      if (mountedRef.current) setIsConnected(false);
    });
    s.off("new_notification").on("new_notification", (n: Notification) => {
      console.log("[AdminSocket] New notification:", n);
      if (mountedRef.current) setNewNotification(n);
    });
  }, []);

  // ── Helper: create a brand-new socket ───────────────────────────────────
  const ensureSocket = useCallback(() => {
    const existing = getAdminSocket();

    // Already have a live socket → reuse (re-attach listeners)
    if (existing?.active) {
      attachListeners(existing);
      setSocket(existing);
      setIsConnected(existing.connected);
      return;
    }

    // Discard stale socket
    if (existing) {
      existing.removeAllListeners();
      existing.disconnect();
      setAdminSocket(null);
    }

    const isDev = process.env.NODE_ENV !== "production";
    const s = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001", {
      withCredentials: true,
      transports: isDev ? ["polling"] : ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 50,
      timeout: 15000,
    });

    setAdminSocket(s);
    attachListeners(s);
    setSocket(s);
  }, [attachListeners]);

  // ── Effect: Connect on mount ────────────────────────────────────────────
  // Runs ONCE. There's no login dependency here since admin layout handles auth.
  useEffect(() => {
    mountedRef.current = true;
    ensureSocket();

    return () => {
      mountedRef.current = false;
      // We don't destroy the socket here because admin navigation might unmount
      // and remount the hook. The socket is a singleton and stays alive while
      // the user is in the admin section.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  return {
    socket,
    isConnected,
    newNotification,
    clearNewNotification,
  };
};
