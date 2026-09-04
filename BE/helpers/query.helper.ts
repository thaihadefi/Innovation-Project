import { FilterQuery } from "mongoose";

export const decodeQueryValue = (value: unknown): string => {
  let raw = String(value ?? "");
  try {
    raw = decodeURIComponent(raw);
  } catch {
  }
  return raw.trim();
};

export const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const buildRegexFilter = <T = unknown>(
  fields: string[],
  keyword?: string
): { $or?: Array<FilterQuery<T>> } => {
  if (!keyword || !keyword.trim() || fields.length === 0) {
    return {};
  }

  const escaped = escapeRegex(keyword.trim());
  return {
    $or: fields.map((field) => ({
      [field]: { $regex: escaped, $options: "i" },
    })) as Array<FilterQuery<T>>,
  };
};
