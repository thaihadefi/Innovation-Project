import { NextFunction, Request, Response } from "express";
import Joi from "joi";

const passwordSchema = Joi.string()
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
    "string.min": "Password must be at least 8 characters!",
    "password.uppercase": "Password must contain at least one uppercase letter!",
    "password.lowercase": "Password must contain at least one lowercase letter!",
    "password.number": "Password must contain at least one digit!",
    "password.special": "Password must contain at least one special character! (~!@#$%^&*)",
  });

const validate = (schema: Joi.ObjectSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ code: "error", message: error.details[0].message });
      return;
    }
    req.body = value;
    next();
  };

export const registerPost = validate(Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Please enter full name!",
    "string.min": "Full name must be at least 2 characters!",
  }),
  email: Joi.string().email().lowercase().required().messages({
    "string.empty": "Please enter email!",
    "string.email": "Invalid email format!",
  }),
  password: passwordSchema,
  phone: Joi.string().optional().allow(""),
}));

export const loginPost = validate(Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    "string.empty": "Please enter email!",
    "string.email": "Invalid email format!",
  }),
  password: Joi.string().required().messages({ "string.empty": "Please enter password!" }),
  rememberPassword: Joi.boolean().optional(),
}));

export const forgotPasswordPost = validate(Joi.object({
  email: Joi.string().email().lowercase().required().messages({
    "string.empty": "Please enter email!",
    "string.email": "Invalid email format!",
  }),
}));

export const otpPasswordPost = validate(Joi.object({
  email: Joi.string().email().lowercase().required(),
  otp: Joi.string().length(6).pattern(/^[0-9]{6}$/).required().messages({
    "string.length": "OTP must be exactly 6 digits!",
    "string.pattern.base": "OTP must contain only digits!",
  }),
}));

export const resetPasswordPost = validate(Joi.object({ password: passwordSchema }));

// ─── Role Validation ─────────────────────────────────────────────────────────

export const createRole = validate(Joi.object({
  name: Joi.string().min(2).max(50).pattern(/^[a-zA-Z0-9\s\-_]+$/).required().messages({
    "string.empty": "Please enter role name!",
    "string.min": "Role name must be at least 2 characters!",
    "string.max": "Role name must not exceed 50 characters!",
    "string.pattern.base": "Role name can only contain letters, numbers, spaces, hyphens and underscores!",
  }),
  description: Joi.string().max(200).allow("").optional().messages({
    "string.max": "Description must not exceed 200 characters!",
  }),
  permissions: Joi.array().items(Joi.string()).optional().default([]),
}));

export const updateRole = validate(Joi.object({
  name: Joi.string().min(2).max(50).pattern(/^[a-zA-Z0-9\s\-_]+$/).optional().messages({
    "string.min": "Role name must be at least 2 characters!",
    "string.max": "Role name must not exceed 50 characters!",
    "string.pattern.base": "Role name can only contain letters, numbers, spaces, hyphens and underscores!",
  }),
  description: Joi.string().max(200).allow("").optional().messages({
    "string.max": "Description must not exceed 200 characters!",
  }),
  permissions: Joi.array().items(Joi.string()).optional(),
}));

// ─── Admin Account Validation ────────────────────────────────────────────────

export const createAccount = validate(Joi.object({
  fullName: Joi.string().min(2).max(100).required().messages({
    "string.empty": "Please enter full name!",
    "string.min": "Full name must be at least 2 characters!",
  }),
  email: Joi.string().email().lowercase().required().messages({
    "string.empty": "Please enter email!",
    "string.email": "Invalid email format!",
  }),
  password: passwordSchema,
  phone: Joi.string().optional().allow(""),
  roleId: Joi.string().optional().allow("", null),
}));

export const updateAccount = validate(Joi.object({
  fullName: Joi.string().min(2).max(100).optional().messages({
    "string.min": "Full name must be at least 2 characters!",
  }),
  email: Joi.string().email().lowercase().optional().messages({
    "string.email": "Invalid email format!",
  }),
  password: passwordSchema.optional(),
  phone: Joi.string().optional().allow(""),
  roleId: Joi.string().optional().allow("", null),
  status: Joi.string().valid("initial", "active", "inactive").optional(),
}));
