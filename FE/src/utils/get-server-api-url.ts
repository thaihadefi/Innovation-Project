/**
 * Returns the API base URL for server-side fetches.
 * Prefers the private API_URL (internal Docker/Kubernetes networking),
 * falls back to NEXT_PUBLIC_API_URL, then localhost for local dev.
 */
export const getServerApiUrl = (): string =>
  (process.env.API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:4001").replace(/\/$/, "");
