import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

const IS_PRODUCTION = process.env.NODE_ENV === "production";
const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS || 800);
const LOG_EVERY_REQUEST = process.env.LOG_EVERY_REQUEST === "true";
const SENSITIVE_QUERY_KEYS = new Set([
  "token",
  "password",
  "otp",
  "email",
  "authorization",
  "code",
  "access_token",
  "refresh_token",
]);

const maskSensitiveQuery = (rawPath: string): string => {
  if (!rawPath.includes("?")) return rawPath;

  try {
    const url = new URL(rawPath, "http://localhost");
    for (const [key, value] of url.searchParams.entries()) {
      if (SENSITIVE_QUERY_KEYS.has(key.toLowerCase()) && value.length > 0) {
        url.searchParams.set(key, "[REDACTED]");
      }
    }
    return `${url.pathname}${url.search}`;
  } catch {
    return rawPath;
  }
};

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const statusCode = res.statusCode;
    const sanitizedPath = maskSensitiveQuery(req.originalUrl || req.url);
    const isExpectedUnauthorizedAuthCheck =
      req.method === "GET" &&
      sanitizedPath.startsWith("/auth/check") &&
      statusCode === 401;
    const shouldLog =
      LOG_EVERY_REQUEST ||
      (statusCode >= 400 && !isExpectedUnauthorizedAuthCheck) ||
      durationMs >= SLOW_REQUEST_MS;

    if (!shouldLog) return;

    const level =
      statusCode >= 500 ? "error" :
      statusCode >= 400 ? "warn" :
      durationMs >= SLOW_REQUEST_MS ? "warn" :
      "info";

    if (IS_PRODUCTION) {
      const logPayload = {
        level,
        type: "http_request",
        requestId,
        method: req.method,
        path: sanitizedPath,
        statusCode,
        durationMs,
        ip: req.ip,
        userAgent: req.headers["user-agent"] || "",
      };

      // Structured single-line JSON logs for easier filtering/ingestion.
      console.log(JSON.stringify(logPayload));
      return;
    }

    console.log(
      `${level.toUpperCase()} ${req.method} ${sanitizedPath} ${statusCode} ${durationMs}ms [${requestId}]`
    );
  });

  next();
};
