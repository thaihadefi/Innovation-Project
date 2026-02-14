import express from "express";
import { createServer } from "http";
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
import { initializeSocket } from "./helpers/socket.helper";
import { rateLimitConfig } from "./config/variable";

const app = express();
const httpServer = createServer(app);

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
});

// Apply rate limiters
app.use("/api", generalLimiter);

// Configure CORS
const defaultDevOrigins = ["http://localhost:3069"];
const envOrigins = (process.env.DOMAIN_FRONTEND || "")
  .split(",")
  .map(origin => origin.trim())
  .filter(Boolean);
const allowedOrigins = envOrigins.length > 0 ? envOrigins : defaultDevOrigins;

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
  credentials: true // Allow sending cookies
}));

// Enable gzip compression for all responses
app.use(compression());

// Allow sending data in JSON format with size limits (prevent large payload attacks)
app.use(express.json({ limit: '10kb' })); // 10kb limit for JSON body
app.use(express.urlencoded({ extended: true, limit: '10kb' })); // Form data limit

// Get variables from cookie
app.use(cookieParser());

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
  } catch (error) {
    console.error("[Bootstrap] Failed to start server due to database connection error.");
    process.exit(1);
  }
};

bootstrap();
