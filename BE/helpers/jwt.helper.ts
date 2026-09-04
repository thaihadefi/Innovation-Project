import jwt from "jsonwebtoken";

export type AuthRole = "candidate" | "company" | "admin";

export interface AuthTokenPayload {
  id: string;
  email: string;
  role: AuthRole;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET environment variable is not defined");
  }
  return secret;
};

export const signAuthToken = (
  payload: AuthTokenPayload,
  rememberPassword?: boolean
): string => {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: rememberPassword ? "7d" : "1d",
  });
};

export const verifyAuthToken = <T extends AuthTokenPayload = AuthTokenPayload>(
  token: string
): T | null => {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded !== "object" || decoded === null) {
      return null;
    }
    const payload = decoded as Partial<AuthTokenPayload>;
    if (typeof payload.id !== "string" || typeof payload.email !== "string") {
      return null;
    }
    return payload as T;
  } catch {
    return null;
  }
};
