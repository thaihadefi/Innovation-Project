"use client";
import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./useAuth";

interface Notification {
  _id: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt: string;
  type?: string;
}

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  newNotification: Notification | null;
  clearNewNotification: () => void;
}

/**
 * Custom hook for Socket.IO real-time notifications
 */
export const useSocket = (): UseSocketReturn => {
  const { isLogin } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);

  useEffect(() => {
    // Only connect when user is logged in
    if (!isLogin) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Create socket connection
    const socketInstance = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001", {
      withCredentials: true, // Send cookies for auth
      transports: ["websocket", "polling"]
    });

    // Connection events
    socketInstance.on("connect", () => {
      console.log("[Socket] Connected:", socketInstance.id);
      setIsConnected(true);
    });

    socketInstance.on("disconnect", () => {
      console.log("[Socket] Disconnected");
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.log("[Socket] Connection error:", error.message);
      setIsConnected(false);
    });

    // Listen for new notifications
    socketInstance.on("new_notification", (notification: Notification) => {
      console.log("[Socket] New notification:", notification);
      setNewNotification(notification);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      socketInstance.disconnect();
    };
  }, [isLogin]);

  const clearNewNotification = useCallback(() => {
    setNewNotification(null);
  }, []);

  return {
    socket,
    isConnected,
    newNotification,
    clearNewNotification
  };
};
