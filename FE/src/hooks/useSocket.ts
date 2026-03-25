"use client";
import { useSocketContext } from "@/contexts/SocketContext";

/**
 * Thin wrapper around SocketContext — consumers get the singleton socket
 * without creating a new connection per component.
 */
export const useSocket = () => useSocketContext();
