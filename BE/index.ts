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

// Connect to database
databaseConfig.connect();

// Initialize Socket.IO for real-time notifications
initializeSocket(httpServer);


// Security middleware - HTTP headers protection
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from different origins
  contentSecurityPolicy: false // Disable CSP for dev flexibility, enable in production if needed
}));

// Rate limiting - Best Practice: Different limits for different endpoints

// General API rate limit
const generalLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.general.max, 
  message: { code: "error", message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip auth routes - they have their own limiter
    return req.path.startsWith("/auth/");
  }
});

const authLimiter = rateLimit({
  windowMs: rateLimitConfig.windowMs,
  max: rateLimitConfig.auth.max, 
  message: { code: "error", message: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip check and logout - they're not login attempts
    return req.path === "/check" || req.path === "/logout";
  }
});

// Apply rate limiters
app.use("/api", generalLimiter);
app.use("/auth", authLimiter);

// Configure CORS
app.use(cors({
  origin: process.env.DOMAIN_FRONTEND, // Only this domain is allowed
  // origin: "*", // All domains are allowed
  credentials: true, // Allow sending cookies
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

// Use httpServer instead of app.listen for Socket.IO support
httpServer.listen(port, () => {
  console.log(`Website is running on port ${port}`)
})
