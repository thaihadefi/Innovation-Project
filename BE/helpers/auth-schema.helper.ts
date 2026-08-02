import Joi from "joi";

// Shared password strength rule — reused by candidate/company/admin registration & reset-password
// validators so the policy can't silently drift between account types.
export const passwordSchema = Joi.string()
  .min(8)
  .custom((value, helpers) => {
    if (!/[A-Z]/.test(value)) return helpers.error("password.uppercase");
    if (!/[a-z]/.test(value)) return helpers.error("password.lowercase");
    if (!/\d/.test(value)) return helpers.error("password.number");
    if (!/[~!@#$%^&*]/.test(value)) return helpers.error("password.special");
    return value;
  })
  .required()
  .messages({
    "string.empty": "Please enter password!",
    "string.min": "Password must be at least 8 characters!",
    "password.uppercase": "Password must contain at least one uppercase letter!",
    "password.lowercase": "Password must contain at least one lowercase letter!",
    "password.number": "Password must contain at least one digit!",
    "password.special": "Password must contain at least one special character! (~!@#$%^&*)",
  });

// Shared 6-digit OTP rule — reused by candidate/company/admin OTP verification endpoints.
export const otpSchema = Joi.string()
  .length(6)
  .pattern(/^[0-9]{6}$/)
  .required()
  .messages({
    "string.empty": "Please enter OTP!",
    "string.length": "OTP must be exactly 6 digits!",
    "string.pattern.base": "OTP must contain only digits!",
    "any.required": "Please enter OTP!",
  });
