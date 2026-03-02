export const normalizeSkillDisplay = (value: string): string => {
  const normalized = value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase();

  // Keep familiar language representation in UI
  if (normalized === "net" || normalized === "dotnet") return ".net";
  if (normalized === "cplusplus") return "c++";
  if (normalized === "csharp") return "c#";
  if (normalized === "fsharp") return "f#";

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

  // Canonical aliases
  if (key === "net" || key === "dotnet") key = ".net";
  if (key === "cplusplus") key = "c++";
  if (key === "csharp") key = "c#";
  if (key === "fsharp") key = "f#";

  // Common JS/TS framework aliases → canonical slugified form
  if (key === "react") key = "reactjs";
  if (key === "node") key = "nodejs";
  if (key === "vue") key = "vuejs";
  if (key === "angular") key = "angularjs";
  if (key === "next") key = "nextjs";
  if (key === "nuxt") key = "nuxtjs";
  if (key === "express") key = "expressjs";
  if (key === "svelte") key = "sveltejs";

  return key;
};
