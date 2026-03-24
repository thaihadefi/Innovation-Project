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

/**
 * Singleton socket provider — one connection for the entire app lifetime.
 * Connects when user is logged in, disconnects on logout.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { isLogin } = useAuthContext();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [newNotification, setNewNotification] = useState<Notification | null>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isLogin) {
      // Disconnect and clean up when user logs out
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Prevent duplicate connections
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

    socketInstance.on("new_notification", (notification: Notification) => {
      console.log("[Socket] New notification:", notification);
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
  }, [isLogin]);

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
