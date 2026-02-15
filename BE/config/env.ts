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
};
