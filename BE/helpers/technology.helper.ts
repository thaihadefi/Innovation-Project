// Helpers for normalizing technology lists supplied by users
import { convertToSlug } from './slugify.helper';

export const normalizeTechnologyName = (name: any): string => {
  if (!name && name !== 0) return "";
  // Convert to string, trim and collapse multiple internal spaces
  return String(name).trim().replace(/\s+/g, " ");
}

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

  // Dedupe by slug (case-insensitive, normalized). Preserve first-seen original display name.
  const seen: { [slug: string]: boolean } = {};
  const result: string[] = [];
  for (const it of items) {
    const slug = convertToSlug(it);
    if (!slug) continue;
    if (!seen[slug]) {
      seen[slug] = true;
      result.push(it);
    }
  }

  return result;
}

export default normalizeTechnologies;
