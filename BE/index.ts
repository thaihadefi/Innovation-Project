import express from "express";
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

const app = express();
// Use PORT from environment when present (easier to override in dev/prod)
const port = process.env.PORT ? Number(process.env.PORT) : 4001;

// Connect to database
databaseConfig.connect();

// Security middleware - HTTP headers protection
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from different origins
  contentSecurityPolicy: false // Disable CSP for dev flexibility, enable in production if needed
}));

// Rate limiting - Best Practice: Different limits for different endpoints

// General API rate limit (100 requests per 15 minutes per IP)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { code: "error", message: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip auth routes - they have their own stricter limiter
    return req.path.startsWith("/auth/");
  }
});

// Stricter rate limit for auth endpoints (10 requests per 15 minutes per IP)
// Prevents brute force attacks on login, register, forgot-password
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Much stricter for auth
  message: { code: "error", message: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
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

app.listen(port, () => {
  console.log(`Website is running on port ${port}`)
})