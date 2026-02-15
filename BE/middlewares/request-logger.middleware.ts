import { NextFunction, Request, Response } from "express";
import { randomUUID } from "crypto";

const SLOW_REQUEST_MS = Number(process.env.SLOW_REQUEST_MS || 800);

export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const requestId = randomUUID();
  const startedAt = Date.now();

  res.setHeader("X-Request-Id", requestId);

  res.on("finish", () => {
    const durationMs = Date.now() - startedAt;
    const logPayload = {
      level: durationMs >= SLOW_REQUEST_MS ? "warn" : "info",
      type: "http_request",
      requestId,
      method: req.method,
      path: req.originalUrl || req.url,
      statusCode: res.statusCode,
      durationMs,
      ip: req.ip,
      userAgent: req.headers["user-agent"] || "",
    };

    // Structured single-line JSON logs for easier filtering/ingestion.
    console.log(JSON.stringify(logPayload));
  });

  next();
};

