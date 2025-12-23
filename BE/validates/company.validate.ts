import { NextFunction, Request, Response } from "express";
import Joi from "joi";

export const registerPost = async (req: Request, res: Response, next: NextFunction) => {
  const schema = Joi.object({
    companyName: Joi.string()
      .min(3)
      .max(200)
      .required()
      .messages({
        "string.empty": "Please enter company name!",
        "string.min": "Company name must be at least 3 characters!",
        "string.max": "Company name must not exceed 200 characters!",
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

// Job creation validation
export const jobCreate = async (req: Request, res: Response, next: NextFunction) => {
  // For multipart/form-data, cities comes as a JSON string
  let citiesArray: string[] = [];
  if (req.body.cities) {
    try {
      citiesArray = JSON.parse(req.body.cities);
    } catch {
      citiesArray = [];
    }
  }

  const schema = Joi.object({
    title: Joi.string()
      .min(5)
      .max(200)
      .required()
      .messages({
        "string.empty": "Please enter job title!",
        "string.min": "Job title must be at least 5 characters!",
        "string.max": "Job title must not exceed 200 characters!",
      }),
    salaryMin: Joi.number()
      .min(0)
      .required()
      .messages({
        "number.base": "Please enter minimum salary!",
        "number.min": "Minimum salary cannot be negative!",
      }),
    salaryMax: Joi.number()
      .min(Joi.ref('salaryMin'))
      .required()
      .messages({
        "number.base": "Please enter maximum salary!",
        "number.min": "Maximum salary must be greater than or equal to minimum salary!",
      }),
    maxApplications: Joi.number().min(0).optional(),
    maxApproved: Joi.number().min(0).optional(),
    position: Joi.string()
      .required()
      .messages({
        "string.empty": "Please select a position!",
      }),
    workingForm: Joi.string()
      .required()
      .messages({
        "string.empty": "Please select a working form!",
      }),
    technologies: Joi.string()
      .required()
      .messages({
        "string.empty": "Please enter at least one technology/skill!",
      }),
    description: Joi.string().allow('').optional(),
    cities: Joi.string().optional(), // Comes as JSON string
  });

  // Validate cities array separately
  if (citiesArray.length === 0) {
    res.json({
      code: "error",
      message: "Please select at least one city!"
    });
    return;
  }

  // Check for at least 1 image (files come in req.files)
  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.json({
      code: "error",
      message: "Please upload at least 1 image for the job posting!"
    });
    return;
  }

  // Validate maxApproved <= maxApplications
  const maxApplications = parseInt(req.body.maxApplications) || 0;
  const maxApproved = parseInt(req.body.maxApproved) || 0;
  if (maxApplications > 0 && maxApproved > maxApplications) {
    res.json({
      code: "error",
      message: "Max Approved cannot exceed Max Applications!"
    });
    return;
  }

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