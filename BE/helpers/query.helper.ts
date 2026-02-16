export const decodeQueryValue = (value: unknown): string => {
  let raw = String(value ?? "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
    // Keep raw string if decoding fails.
  }
  return raw.trim();
};

export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
