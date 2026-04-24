/**
 * Returns the API base URL.
 * Server-side: Prefers API_URL (internal Docker network).
 * Client-side: MUST use NEXT_PUBLIC_API_URL.
 */
export const getServerApiUrl = (): string => {
  if (typeof window === "undefined") {
    // Server-side
    return (process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001").replace(/\/$/, "");
  }
  // Client-side
  return (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4001").replace(/\/$/, "");
};
