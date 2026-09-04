import { convertToSlug } from "./slugify.helper";

export const normalizeSkillName = (name: unknown): string => {
  if (!name && name !== 0) return "";
  return String(name).trim().replace(/\s+/g, " ");
};

export const normalizeSkillKey = (name: unknown): string => {
  const normalizedName = normalizeSkillName(name);
  if (!normalizedName) return "";

  const value = normalizedName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

  const key = value
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9+.#-]/g, "");

  return key || convertToSlug(normalizedName);
};

export const normalizeSkills = (input: unknown): string[] => {
  if (!input && input !== 0) return [];

  let items: string[] = [];

  if (Array.isArray(input)) {
    items = input.map((i: unknown) => normalizeSkillName(i)).filter(Boolean);
  } else if (typeof input === "string") {
    items = input.split(/[;,]+/).map((s) => normalizeSkillName(s)).filter(Boolean);
  } else {
    items = String(input).split(/[;,]+/).map((s) => normalizeSkillName(s)).filter(Boolean);
  }

  const seen: Record<string, boolean> = {};
  const result: string[] = [];
  for (const it of items) {
    const key = normalizeSkillKey(it);
    if (!key) continue;
    if (!seen[key]) {
      seen[key] = true;
      result.push(key);
    }
  }

  return result;
};

export default normalizeSkills;
