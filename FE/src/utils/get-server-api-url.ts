/**
 * Returns the API base URL.
 * Server-side: Prefers API_URL (internal Docker network).
 * Client-side: MUST use NEXT_PUBLIC_API_URL.
 */
export const getServerApiUrl = (): string => {
  // Ưu tiên các biến được truyền từ môi trường Docker
  const API_URL = process.env.API_URL || "";
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  if (typeof window === "undefined") {
    // Chạy trên Server (SSR): http://nginx-proxy/api hoặc localhost:4001
    return (API_URL || NEXT_PUBLIC_API_URL || "http://localhost:4001").replace(/\/$/, "");
  }
  
  // Chạy trên Client: /api hoặc http://localhost:4001
  return (NEXT_PUBLIC_API_URL || "http://localhost:4001").replace(/\/$/, "");
};
