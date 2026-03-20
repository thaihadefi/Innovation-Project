import express from "express";
import { createServer } from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
// Load environment variables
dotenv.config();
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

validateEnv();

const app = express();
// Trust first proxy (Nginx/load balancer) — required for correct client IP in rate limiters
// Without this, all requests appear from the proxy's IP and share one rate limit counter
app.set('trust proxy', 1);
const httpServer = createServer(app);
let isShuttingDown = false;

// Use PORT from environment when present (easier to override in dev/prod)
const port = process.env.PORT ? Number(process.env.PORT) : 4001;

// Initialize Socket.IO for real-time notifications
initializeSocket(httpServer);


// Security middleware - HTTP headers protection
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from different origins
  contentSecurityPolicy: false // Disable CSP for dev flexibility, enable in production if needed
}));

// Rate limiting - Best Practice: Different limits for sensitive endpoints

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.general.max, 
  message: { code: "error", message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === "OPTIONS",
});

// Apply general limiter to all app routes (current routes are mounted at "/")
app.use(generalLimiter);

// Dev: allow all origins; Prod: restrict to DOMAIN_FRONTEND env var
const corsOrigin = process.env.NODE_ENV === "production"
  ? (process.env.DOMAIN_FRONTEND || "").split(",").map(o => o.trim()).filter(Boolean)
  : true;
app.use(cors({ origin: corsOrigin, credentials: true }));

// Enable gzip compression for all responses
app.use(compression());

// Allow sending data in JSON format with size limits (prevent large payload attacks)
app.use(express.json({ limit: '10kb' })); // 10kb limit for JSON body
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Form data limit

// Get variables from cookie
app.use(cookieParser());

// Structured request logs with latency + request id.
app.use(requestLogger);

// Initialize routes
app.use("/", routes);

const bootstrap = async () => {
  try {
    // Only start accepting traffic after DB is connected
    await databaseConfig.connect();

    // Use httpServer instead of app.listen for Socket.IO support
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

// Nodemon uses SIGUSR2 on restart. Handle it so old process releases the port cleanly.
process.on("SIGUSR2", () => {
  shutdown("SIGUSR2")
    .then(() => {
      process.kill(process.pid, "SIGUSR2");
    })
    .catch(() => process.exit(1));
});
