export const hasAlphaNum = (value: string) => /[\p{L}\p{N}]/u.test(value);

export const normalizeKeyword = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: "", isValid: true };
  }
  return { value: trimmed, isValid: hasAlphaNum(trimmed) };
};
