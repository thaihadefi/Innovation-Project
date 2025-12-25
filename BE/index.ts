import express from "express";
import dotenv from "dotenv";
// Load environment variables
dotenv.config();
import cors from "cors";
import compression from "compression";
import routes from "./routes/index.route";
import * as databaseConfig from "./config/database.config";
import cookieParser = require("cookie-parser");

const app = express();
// Use PORT from environment when present (easier to override in dev/prod)
const port = process.env.PORT ? Number(process.env.PORT) : 4001;

// Connect to database
databaseConfig.connect();

// Configure CORS
app.use(cors({
  origin: process.env.DOMAIN_FRONTEND, // Only this domain is allowed
  // origin: "*", // All domains are allowed
  credentials: true, // Allow sending cookies
}));

// Enable gzip compression for all responses
app.use(compression());

// Allow sending data in JSON format
app.use(express.json());

// Get variables from cookie
app.use(cookieParser());

// Initialize routes
app.use("/", routes);

app.listen(port, () => {
  console.log(`Website is running on port ${port}`)
})