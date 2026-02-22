import { NextFunction, Request, Response } from "express";
import Joi from "joi";

// Helper function to validate expiration date
const validateExpirationDate = (dateStr: string): { valid: boolean; message?: string } => {
  if (!dateStr || dateStr === '') {
    return { valid: true }; // Optional field
  }
  
  // Parse the date string (expected format: YYYY-MM-DD from input type="date")
  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return { valid: false, message: "Please enter a valid expiration date." };
  }
  
  const inputYear = parseInt(parts[0], 10);
  const inputMonth = parseInt(parts[1], 10); // 1-12
  const inputDay = parseInt(parts[2], 10);
  
  // Check for NaN
  if (isNaN(inputYear) || isNaN(inputMonth) || isNaN(inputDay)) {
    return { valid: false, message: "Please enter a valid expiration date." };
  }
  
  // Create Date object (month is 0-indexed in JS)
  const parsedDate = new Date(inputYear, inputMonth - 1, inputDay);
  
  // Check if Date constructor auto-corrected an invalid date (e.g., Feb 29 on non-leap year)
  // The Date constructor will auto-correct 2025-02-29 to 2025-03-01
  if (
    parsedDate.getFullYear() !== inputYear ||
    parsedDate.getMonth() !== inputMonth - 1 ||
    parsedDate.getDate() !== inputDay
  ) {
    return { valid: false, message: "Please enter a valid calendar date! (e.g., Feb 29 only on leap years)" };
  }
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(2099, 11, 31); // Dec 31, 2099
  
  // Check if date is in the future
  if (parsedDate < today) {
    return { valid: false, message: "Expiration date must be today or in the future." };
  }
  
  // Check if date is before 2100
  if (parsedDate > maxDate) {
    return { valid: false, message: "Expiration date must be before year 2100." };
  }
  
  return { valid: true };
};

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

const jobPayloadSchema = Joi.object({
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
  skills: Joi.string()
    .required()
    .messages({
      "string.empty": "Please enter at least one skill!",
    }),
  description: Joi.string().allow('').optional(),
  locations: Joi.string().optional(),
  expirationDate: Joi.string().allow('').optional(),
  existingImages: Joi.string().allow('').optional(),
});

const parseArrayField = (raw: unknown, warningMessage: string): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    console.warn(warningMessage);
    return [];
  }
};

const validateCommonJobPayload = (
  req: Request,
  res: Response,
  locationsArray: string[]
): boolean => {
  if (locationsArray.length === 0) {
    res.status(400).json({
      code: "error",
      message: "Please select at least one location."
    });
    return false;
  }

  const maxApplications = parseInt(req.body.maxApplications) || 0;
  const maxApproved = parseInt(req.body.maxApproved) || 0;
  if (maxApplications > 0 && maxApproved > maxApplications) {
    res.status(400).json({
      code: "error",
      message: "Max Approved cannot exceed Max Applications."
    });
    return false;
  }

  const dateValidation = validateExpirationDate(req.body.expirationDate);
  if (!dateValidation.valid) {
    res.status(400).json({
      code: "error",
      message: dateValidation.message
    });
    return false;
  }

  const { error } = jobPayloadSchema.validate(req.body);
  if (error) {
    res.status(400).json({
      code: "error",
      message: error.details[0].message
    });
    return false;
  }

  return true;
};

// Job creation validation
export const jobCreate = async (req: Request, res: Response, next: NextFunction) => {
  const locationsArray = parseArrayField(
    req.body.locations,
    "[Validate] Failed to parse locations payload (create)"
  );

  const files = req.files as Express.Multer.File[];
  if (!files || files.length === 0) {
    res.status(400).json({
      code: "error",
      message: "Please upload at least 1 image for the job posting."
    });
    return;
  }
  if (files.length > 6) {
    res.status(400).json({
      code: "error",
      message: "You can upload at most 6 images."
    });
    return;
  }

  if (!validateCommonJobPayload(req, res, locationsArray)) {
    return;
  }

  next();
}

export const jobEdit = async (req: Request, res: Response, next: NextFunction) => {
  const locationsArray = parseArrayField(
    req.body.locations,
    "[Validate] Failed to parse locations payload (edit)"
  );
  const existingImages = parseArrayField(
    req.body.existingImages,
    "[Validate] Failed to parse existingImages payload"
  );

  const files = req.files as Express.Multer.File[];
  if ((!files || files.length === 0) && existingImages.length === 0) {
    res.status(400).json({
      code: "error",
      message: "Please have at least 1 image for the job posting."
    });
    return;
  }
  if ((files?.length || 0) + existingImages.length > 6) {
    res.status(400).json({
      code: "error",
      message: "You can upload at most 6 images."
    });
    return;
  }

  if (!validateCommonJobPayload(req, res, locationsArray)) {
    return;
  }

  next();
}
