// Shared page-number parsing so every paginated endpoint clamps/parses "page" the same way.
export const parsePage = (raw: unknown): number => {
  const parsed = parseInt(String(raw ?? "1"), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

// Shared client-supplied page-size parsing, clamped to a server-side max to avoid large queries.
export const parsePageSize = (raw: unknown, fallback: number, max: number): number => {
  const parsed = parseInt(String(raw ?? ""), 10);
  const size = Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
  return Math.min(size, max);
};
