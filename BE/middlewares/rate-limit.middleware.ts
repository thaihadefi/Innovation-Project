import rateLimit from "express-rate-limit";
import { rateLimitConfig } from "../config/variable";

const baseOptions = {
  windowMs: rateLimitConfig.windowMs,
  standardHeaders: true,
  legacyHeaders: false,
};

export const loginLimiter = rateLimit({
  ...baseOptions,
  max: rateLimitConfig.login.max,
  message: { code: "error", message: "Too many login attempts, please try again later." },
});

export const applyLimiter = rateLimit({
  ...baseOptions,
  max: rateLimitConfig.apply.max,
  message: { code: "error", message: "Too many apply attempts, please try again later." },
});

export const searchLimiter = rateLimit({
  ...baseOptions,
  max: rateLimitConfig.search.max,
  message: { code: "error", message: "Too many search requests, please try again later." },
});
