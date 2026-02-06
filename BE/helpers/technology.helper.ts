// Helpers for normalizing technology lists supplied by users
import { convertToSlug } from './slugify.helper';

export const normalizeTechnologyName = (name: any): string => {
  if (!name && name !== 0) return "";
  // Convert to string, trim and collapse multiple internal spaces
  return String(name).trim().replace(/\s+/g, " ");
}

// Canonical key used for technologySlugs/search matching.
// Keeps common special-language distinctions (e.g. C++ vs C#).
export const normalizeTechnologyKey = (name: any): string => {
  const normalizedName = normalizeTechnologyName(name);
  if (!normalizedName) return "";

  const value = normalizedName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  // Keep common language symbols in canonical key.
  let key = value
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9+.#]/g, "");

  // Canonical aliases to avoid duplicates
  if (key === "net") key = ".net";
  if (key === "dotnet") key = ".net";
  if (key === "cplusplus") key = "c++";
  if (key === "csharp") key = "c#";
  if (key === "fsharp") key = "f#";

  // Fallback to legacy slug behavior only when key becomes empty
  return key || convertToSlug(normalizedName);
};

// Normalize input (string or array), split on commas/semicolons, trim, and dedupe by slug.
export const normalizeTechnologies = (input: any): string[] => {
  if (!input && input !== 0) return [];

  let items: string[] = [];

  if (Array.isArray(input)) {
    items = input.map(i => normalizeTechnologyName(i)).filter(Boolean);
  } else if (typeof input === 'string') {
    items = input.split(/[;,]+/).map(s => normalizeTechnologyName(s)).filter(Boolean);
  } else {
    items = String(input).split(/[;,]+/).map(s => normalizeTechnologyName(s)).filter(Boolean);
  }

  // Dedupe by canonical tech key. Preserve first-seen display name.
  const seen: { [key: string]: boolean } = {};
  const result: string[] = [];
  for (const it of items) {
    const key = normalizeTechnologyKey(it);
    if (!key) continue;
    if (!seen[key]) {
      seen[key] = true;
      result.push(it);
    }
  }

  return result;
}

export default normalizeTechnologies;
