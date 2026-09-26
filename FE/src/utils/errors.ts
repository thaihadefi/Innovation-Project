export const isAbortError = (error: unknown): boolean =>
  error instanceof Error && error.name === "AbortError";

export const errorMessage = (error: unknown, fallback = "Something went wrong."): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
};
