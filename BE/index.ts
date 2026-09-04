import { createServer } from "http";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ override: false });
import * as databaseConfig from "./config/database.config";
import { closeSocketServer, initializeSocket } from "./helpers/socket.helper";
import { validateEnv } from "./config/env";
import { closeCacheConnection } from "./helpers/cache.helper";
import { createApp, getCorsOrigin } from "./app";

validateEnv();

const app = createApp();
const httpServer = createServer(app);
let isShuttingDown = false;

const port = process.env.PORT ? Number(process.env.PORT) : 4001;

initializeSocket(httpServer, getCorsOrigin());

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
  } catch {
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
