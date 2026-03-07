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

/**
 * Custom hook for Socket.IO real-time notifications (admin)
 * Always connects — admin layout already verifies auth.
 */
export const useAdminSocket = (): UseAdminSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketRef.current) return;

    const isDev = process.env.NODE_ENV !== "production";
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001", {
      withCredentials: true,
      transports: isDev ? ["polling"] : ["polling", "websocket"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketInstance.on("connect", () => {
      console.log("[AdminSocket] Connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("[AdminSocket] Disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.log("[AdminSocket] Connection error:", error.message);
      setIsConnected(false);
    });

    socketInstance.on("new_notification", (notification: Notification) => {
      console.log("[AdminSocket] New notification:", notification);
      setNewNotification(notification);
    });

    socketRef.current = socketInstance;
    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      socketRef.current = null;
      setSocket(null);
      setIsConnected(false);
    };
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
