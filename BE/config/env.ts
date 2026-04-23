const REQUIRED_ENV_KEYS = ["DATABASE", "JWT_SECRET"] as const;

export const validateEnv = (): void => {
  const missing = REQUIRED_ENV_KEYS.filter((key) => {
    const value = process.env[key];
    return typeof value !== "string" || value.trim() === "";
  });

  if (missing.length > 0) {
    console.error(`[Env] Missing required environment variables: ${missing.join(", ")}`);
    process.exit(1);
  }

  if (process.env.PORT && Number.isNaN(Number(process.env.PORT))) {
    console.error("[Env] Invalid PORT. PORT must be a number.");
    process.exit(1);
  }

  // Warn if DOMAIN_FRONTEND is unset in production — Socket.IO and CORS will block all browser origins
  if (process.env.NODE_ENV === "production" && !process.env.DOMAIN_FRONTEND) {
    console.warn("[Env] DOMAIN_FRONTEND is not set in production. All browser CORS/Socket requests will be rejected.");
  }

  // Warn if FRONTEND_URL is unset in production — email links will point to localhost
  if (process.env.NODE_ENV === "production" && !process.env.FRONTEND_URL) {
    console.warn("[Env] FRONTEND_URL is not set in production. Email links will point to localhost.");
  }
};

// Required — guaranteed present after validateEnv() runs at startup
export const DATABASE = process.env.DATABASE!;
export const JWT_SECRET = process.env.JWT_SECRET!;

// Derived
export const IS_PRODUCTION = process.env.NODE_ENV === "production";

// Optional with defaults
export const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3069";
export const ATLAS_SEARCH_INDEX = process.env.ATLAS_SEARCH_INDEX || "default";

// Optional — may be undefined (not required for all environments)
export const DOMAIN_FRONTEND = process.env.DOMAIN_FRONTEND;
export const CLOUDINARY_NAME = process.env.CLOUDINARY_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
export const GMAIL_USER = process.env.GMAIL_USER;
export const GMAIL_PASS = process.env.GMAIL_PASS;
