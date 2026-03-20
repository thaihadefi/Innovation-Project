export const normalizeSkillDisplay = (value: string): string => {
  const normalized = value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  return normalized;
};

export const normalizeSkillKey = (value: string): string => {
  const display = normalizeSkillDisplay(value);
  if (!display) return "";

  let key = display
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9+.#-]/g, ""); // dash at end to avoid invalid range

  return key;
};
