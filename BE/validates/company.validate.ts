import { NextFunction, Request, Response } from "express";
import Joi from "joi";
import { passwordSchema, otpSchema } from "../helpers/auth-schema.helper";
import { validateBody } from "../helpers/validate.helper";

const emailSchema = Joi.string().email().lowercase().required().messages({
  "string.empty": "Please enter email!",
  "string.email": "Invalid email format!",
});

const companyNameSchema = Joi.string().min(3).max(200).required().messages({
  "string.empty": "Please enter company name!",
  "string.min": "Company name must be at least 3 characters!",
  "string.max": "Company name must not exceed 200 characters!",
});

const validateExpirationDate = (dateStr: string): { valid: boolean; message?: string } => {
  if (!dateStr || dateStr === '') {
    return { valid: true };
  }

  const parts = dateStr.split('-');
  if (parts.length !== 3) {
    return { valid: false, message: "Please enter a valid expiration date." };
  }

  const inputYear = parseInt(parts[0], 10);
  const inputMonth = parseInt(parts[1], 10);
  const inputDay = parseInt(parts[2], 10);

  if (isNaN(inputYear) || isNaN(inputMonth) || isNaN(inputDay)) {
    return { valid: false, message: "Please enter a valid expiration date." };
  }

  const parsedDate = new Date(inputYear, inputMonth - 1, inputDay);

  if (
    parsedDate.getFullYear() !== inputYear ||
    parsedDate.getMonth() !== inputMonth - 1 ||
    parsedDate.getDate() !== inputDay
  ) {
    return { valid: false, message: "Please enter a valid calendar date! (e.g., Feb 29 only on leap years)" };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(2099, 11, 31);

  if (parsedDate < today) {
    return { valid: false, message: "Expiration date must be today or in the future." };
  }

  if (parsedDate > maxDate) {
    return { valid: false, message: "Expiration date must be before year 2100." };
  }

  return { valid: true };
};

export const registerPost = validateBody(Joi.object({
  companyName: companyNameSchema,
  email: emailSchema,
  password: passwordSchema,
}));

export const loginPost = validateBody(Joi.object({
  email: emailSchema,
  password: Joi.string().required().messages({ "string.empty": "Please enter password!" }),
  rememberPassword: Joi.boolean().optional(),
}));

export const resetPasswordPost = validateBody(Joi.object({
  password: passwordSchema,
}));

export const profilePatch = validateBody(Joi.object({
  companyName: Joi.string().min(3).max(200).optional().messages({
    "string.min": "Company name must be at least 3 characters!",
    "string.max": "Company name must not exceed 200 characters!",
  }),
  email: Joi.string().email().lowercase().optional().messages({
    "string.email": "Invalid email format!",
  }),
  phone: Joi.string()
    .pattern(/^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/)
    .optional()
    .allow('')
    .messages({
      "string.pattern.base": "Invalid phone number format!",
    }),
  logo: Joi.any().optional(),
  address: Joi.string().optional().allow(''),
  description: Joi.string().optional().allow(''),
  website: Joi.string().optional().allow(''),
  facebook: Joi.string().optional().allow(''),
  linkedin: Joi.string().optional().allow(''),
  taxCode: Joi.string().optional().allow(''),
  size: Joi.string().optional().allow(''),
  industry: Joi.string().optional().allow(''),
  foundedYear: Joi.number().integer().min(1800).max(new Date().getFullYear()).optional().allow(null).messages({
    "number.min": "Founded year is invalid!",
    "number.max": "Founded year cannot be in the future!",
  }),
  companyType: Joi.string().optional().allow(''),
  location: Joi.string().optional().allow(''),
  workingTime: Joi.string().optional().allow(''),
  workOverTime: Joi.string().optional().allow(''),
  companyModel: Joi.string().optional().allow(''),
  companyEmployees: Joi.string().optional().allow(''),
}).options({ allowUnknown: false }));

export const requestEmailChange = validateBody(Joi.object({
  newEmail: Joi.string().email().lowercase().required().messages({
    "string.empty": "Please provide new email!",
    "string.email": "Invalid email format!",
    "any.required": "Please provide new email!",
  }),
}));

export const otpPasswordPost = validateBody(Joi.object({
  email: emailSchema.messages({
    "string.empty": "Please enter email!",
    "string.email": "Invalid email format!",
    "any.required": "Please enter email!",
  }),
  otp: otpSchema,
}));

export const verifyEmailChange = validateBody(Joi.object({
  otp: otpSchema,
}));

export const forgotPasswordPost = validateBody(Joi.object({
  email: emailSchema,
}));

const jobPayloadSchema = Joi.object({
  title: Joi.string()
    .trim()
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
      "string.base": "Please enter at least one skill!",
      "string.empty": "Please enter at least one skill!",
    }),
  description: Joi.string().allow('').optional(),
  locations: Joi.string().optional(),
  expirationDate: Joi.string().allow('').optional(),
  existingImages: Joi.string().allow('').optional(),
  imageOrder: Joi.string().allow('').optional(),
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
