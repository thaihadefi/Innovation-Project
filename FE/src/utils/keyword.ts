export const hasAlphaNum = (value: string) => /[a-z0-9]/i.test(value);

export const normalizeKeyword = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) {
    return { value: "", isValid: true };
  }
  return { value: trimmed, isValid: hasAlphaNum(trimmed) };
};

