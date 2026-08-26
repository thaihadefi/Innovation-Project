import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ override: false });
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import routes from "./routes/index.route";
import * as databaseConfig from "./config/database.config";
import cookieParser = require("cookie-parser");
import { closeSocketServer, initializeSocket } from "./helpers/socket.helper";
import { rateLimitConfig } from "./config/variable";
import { validateEnv } from "./config/env";
import { closeCacheConnection } from "./helpers/cache.helper";
import { requestLogger } from "./middlewares/request-logger.middleware";
import { serverError } from "./helpers/response.helper";

validateEnv();

const app = express();
app.set('trust proxy', 1);
const httpServer = createServer(app);
let isShuttingDown = false;

const port = process.env.PORT ? Number(process.env.PORT) : 4001;

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: process.env.NODE_ENV === "production" ? undefined : false
}));

const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.general.max,
  message: { code: "error", message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS" || req.path.startsWith("/socket.io/"),
});

app.use(generalLimiter);

const corsOrigin = process.env.NODE_ENV === "production"
  ? (process.env.DOMAIN_FRONTEND || "").split(",").map(o => o.trim()).filter(Boolean)
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));

initializeSocket(httpServer, corsOrigin);

app.use(compression());

app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' })); 

app.use(cookieParser());

app.use(requestLogger);

app.use("/", routes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const error = err as { message?: string };
  console.error("[UnhandledError]", error?.message || err);
  if (res.headersSent) return;
  serverError(res, "Internal server error.");
});

process.on("unhandledRejection", (reason: unknown) => {
  const r = reason as { message?: string };
  console.error("[UnhandledRejection]", r?.message || reason);
});

const bootstrap = async () => {
  try {
    await databaseConfig.connect();

    httpServer.listen(port, () => {
      console.log(`Website is running on port ${port}`);
    });

    httpServer.on("error", (error: NodeJS.ErrnoException) => {
      if (error.code === "EADDRINUSE") {
        console.error(`[Bootstrap] Port ${port} is already in use. Stop the existing process or use a different PORT.`);
      } else {
        console.error("[Bootstrap] HTTP server failed to start:", error);
      }
      process.exit(1);
    });
  } catch (error) {
    console.error("[Bootstrap] Failed to start server due to database connection error.");
    process.exit(1);
  }
};

bootstrap();

const shutdown = async (signal: string) => {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`[Shutdown] Received ${signal}. Closing server...`);

  try {
    await Promise.all([
      closeSocketServer(),
      closeCacheConnection(),
      mongoose.disconnect(),
    ]);
  } catch (error) {
    console.error("[Shutdown] Error while closing services:", error);
  }

  await new Promise<void>((resolve) => {
    httpServer.close(() => resolve());
  });

  process.exit(0);
};

process.on("SIGINT", () => {
  shutdown("SIGINT").catch(() => process.exit(1));
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM").catch(() => process.exit(1));
});

process.on("SIGUSR2", () => {
  shutdown("SIGUSR2")
    .then(() => {
      process.kill(process.pid, "SIGUSR2");
    })
    .catch(() => process.exit(1));
});
