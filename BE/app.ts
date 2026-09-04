import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser = require("cookie-parser");
import routes from "./routes/index.route";
import { rateLimitConfig } from "./config/variable";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { serverError } from "./helpers/response.helper";

/** Resolves the allowed CORS / Socket.IO origin(s) from the environment. */
export const getCorsOrigin = (): string[] | boolean =>
  process.env.NODE_ENV === "production"
    ? (process.env.DOMAIN_FRONTEND || "").split(",").map((o) => o.trim()).filter(Boolean)
    : true;

/**
 * Builds the Express application (middleware + routes + error handler) without
 * binding a port or wiring Socket.IO. index.ts owns the HTTP server lifecycle;
 * tests import this directly.
 */
export const createApp = (): express.Express => {
  const app = express();
  app.set("trust proxy", 1);

  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false,
  }));

  app.use(rateLimit({
    windowMs: rateLimitConfig.windowMs,
    max: rateLimitConfig.general.max,
    message: { code: "error", message: "Too many requests, please try again later." },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === "OPTIONS" || req.path.startsWith("/socket.io/"),
  }));

  app.use(cors({ origin: getCorsOrigin(), credentials: true }));

  app.use(compression());
  app.use(express.json({ limit: "50kb" }));
  app.use(express.urlencoded({ extended: true, limit: "50kb" }));
  app.use(cookieParser());
  app.use(requestLogger);

  app.use("/", routes);

  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const error = err as { message?: string };
    console.error("[UnhandledError]", error?.message || err);
    if (res.headersSent) return;
    serverError(res, "Internal server error.");
  });

  return app;
};
