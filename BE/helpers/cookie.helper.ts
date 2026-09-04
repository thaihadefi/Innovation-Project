import { CookieOptions, Request } from "express";

export interface AuthCookieConfig {
  maxAge?: number;
  httpOnly?: boolean;
  sameSite?: "lax" | "strict" | "none" | boolean;
  secure?: boolean;
}

export const getAuthCookieOptions = (req: Request, maxAge?: number): CookieOptions => {
  const isSecure = req.secure || req.headers["x-forwarded-proto"] === "https";
  const options: CookieOptions = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: isSecure,
  };

  if (typeof maxAge === "number") {
    options.maxAge = maxAge;
  }

  return options;
};
