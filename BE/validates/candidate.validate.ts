import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const registerPost = async (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    fullName: Joi.string()
      .min(5)
      .max(50)
      .required()
      .messages({
        "string.empty": "Please enter full name!",
        "string.min": "Full name must be at least 5 characters!",
        "string.max": "Full name must not exceed 50 characters!",
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        "string.empty": "Please enter email!",
        "string.email": "Invalid email format!",
      }),
    password: Joi.string()
      .min(8)
      .custom((value, helpers) => {
        if(!/[A-Z]/.test(value)) {
          return helpers.error('password.uppercase');
        }
        if(!/[a-z]/.test(value)) {
          return helpers.error('password.lowercase');
        }
        if(!/\d/.test(value)) {
          return helpers.error('password.number');
        }
        if(!/[~!@#$%^&*]/.test(value)) {
          return helpers.error('password.special');
        }
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
      }),
  })

  const { error } = schema.validate(req.body);

  if(error) {
    const errorMessage = error.details[0].message;
    
    res.status(400).json({
      code: "error",
      message: errorMessage
    })
    return;
  }

  next();
}

export const loginPost = async (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    email: Joi.string()
      .email()
      .required()
      .messages({
        "string.empty": "Please enter email!",
        "string.email": "Invalid email format!",
      }),
    password: Joi.string()
      .required()
      .messages({
        "string.empty": "Please enter password!",
      }),
    rememberPassword: Joi.boolean().optional(),
  })

  const { error } = schema.validate(req.body);

  if(error) {
    const errorMessage = error.details[0].message;
    
    res.status(400).json({
      code: "error",
      message: errorMessage
    })
    return;
  }

  next();
}

export const profilePatch = async (req: Request, res: Response, next: NextFunction) => {
  const currentYear = new Date().getFullYear();
  const schema = Joi.object({
    fullName: Joi.string()
      .min(5)
      .max(50)
      .required()
      .messages({
        "string.empty": "Please enter full name!",
        "string.min": "Full name must be at least 5 characters!",
        "string.max": "Full name must not exceed 50 characters!",
      }),
    email: Joi.string()
      .email()
      .required()
      .messages({
        "string.empty": "Please enter email!",
        "string.email": "Invalid email format!",
      }),
    phone: Joi.string()
      .pattern(/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/)
      .required()
      .messages({
        "string.empty": "Please enter phone number!",
        "string.pattern.base": "Invalid phone number format!",
      }),
    studentId: Joi.string()
      .pattern(/^[0-9]{8}$/)
      .required()
      .messages({
        "string.empty": "Please enter student ID!",
        "string.pattern.base": "Student ID must be exactly 8 digits!",
      }),
    cohort: Joi.number().integer().min(2006).max(currentYear).required().messages({
      "number.base": "Cohort must be a year number!",
      "number.integer": "Cohort must be a valid year!",
      "number.min": "Cohort must be from 2006 onwards!",
      "number.max": "Cohort cannot be in the future!",
      "any.required": "Please enter cohort!",
    }),
    major: Joi.string()
      .min(2)
      .max(100)
      .pattern(/^[\p{L}0-9 .,&()\-]+$/u)
      .required()
      .messages({
        "string.empty": "Please enter major!",
        "string.min": "Major must be at least 2 characters!",
        "string.max": "Major must not exceed 100 characters!",
        "string.pattern.base": "Major contains invalid characters!",
      }),
    avatar: Joi.any().optional(),
    skills: Joi.string()
      .required()
      .custom((value, helpers) => {
        try {
          const parsed = JSON.parse(value);
          if (!Array.isArray(parsed) || parsed.length === 0) {
            return helpers.error("any.invalid");
          }
          return value;
        } catch {
          return helpers.error("any.invalid");
        }
      })
      .messages({
        "string.empty": "Please enter at least one skill!",
        "any.required": "Please enter at least one skill!",
        "any.invalid": "Please enter at least one skill!",
      }), // JSON string of skills array
  })

  const { error } = schema.validate(req.body);

  if(error) {
    const errorMessage = error.details[0].message;
    
    res.status(400).json({
      code: "error",
      message: errorMessage
    })
    return;
  }

  next();
}
