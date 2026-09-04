export const getServerApiUrl = (): string => {
  const API_URL = process.env.API_URL || "";
  const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL || "";

  if (typeof window === "undefined") {
    return (API_URL || NEXT_PUBLIC_API_URL || "http://localhost:4001").replace(/\/$/, "");
  }
  
  return (NEXT_PUBLIC_API_URL || "http://localhost:4001").replace(/\/$/, "");
};
