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
