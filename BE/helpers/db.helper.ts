/** True when the value is a 24-character hex string (a Mongo ObjectId). */
export const isObjectId = (value: unknown): value is string =>
  typeof value === "string" && /^[a-fA-F0-9]{24}$/.test(value);

/** True when a caught error is a MongoDB duplicate-key error (E11000). */
export const isDuplicateKeyError = (error: unknown): boolean =>
  typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;
