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
    
    res.json({
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
    rememberPassword: Joi.boolean().optional(),
  })

  const { error } = schema.validate(req.body);

  if(error) {
    const errorMessage = error.details[0].message;
    
    res.json({
      code: "error",
      message: errorMessage
    })
    return;
  }

  next();
}