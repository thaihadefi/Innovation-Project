import { NextFunction, Request, Response } from "express";
import Joi from "joi";

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

export const createReview = validate(Joi.object({
  companyId: Joi.string().required().messages({
    "string.empty": "Company ID is required!",
  }),
  overallRating: Joi.number().min(1).max(5).required().messages({
    "number.base": "Overall rating must be a number!",
    "number.min": "Please provide an overall rating!",
    "number.max": "Overall rating cannot exceed 5!",
  }),
  ratings: Joi.object({
    salary: Joi.number().min(1).max(5).allow(null).optional(),
    workLifeBalance: Joi.number().min(1).max(5).allow(null).optional(),
    career: Joi.number().min(1).max(5).allow(null).optional(),
    culture: Joi.number().min(1).max(5).allow(null).optional(),
    management: Joi.number().min(1).max(5).allow(null).optional(),
  }).optional(),
  title: Joi.string().min(5).max(100).required().messages({
    "string.empty": "Please enter a review title!",
    "string.min": "Review title must be at least 5 characters!",
    "string.max": "Review title must not exceed 100 characters!",
  }),
  content: Joi.string().min(20).max(5000).required().messages({
    "string.empty": "Please write your review content!",
    "string.min": "Review content must be at least 20 characters!",
    "string.max": "Review content must not exceed 5000 characters!",
  }),
  pros: Joi.string().max(2000).allow("").optional().messages({
    "string.max": "Pros must not exceed 2000 characters!",
  }),
  cons: Joi.string().max(2000).allow("").optional().messages({
    "string.max": "Cons must not exceed 2000 characters!",
  }),
  isAnonymous: Joi.boolean().optional().default(true),
}));

export const updateReview = validate(Joi.object({
  overallRating: Joi.number().min(1).max(5).required().messages({
    "number.base": "Overall rating must be a number!",
    "number.min": "Overall rating must be at least 1!",
    "number.max": "Overall rating cannot exceed 5!",
  }),
  ratings: Joi.object({
    salary: Joi.number().min(1).max(5).allow(null).optional(),
    workLifeBalance: Joi.number().min(1).max(5).allow(null).optional(),
    career: Joi.number().min(1).max(5).allow(null).optional(),
    culture: Joi.number().min(1).max(5).allow(null).optional(),
    management: Joi.number().min(1).max(5).allow(null).optional(),
  }).required(),
  title: Joi.string().min(5).max(100).required().messages({
    "string.empty": "Review title is required!",
    "string.min": "Review title must be at least 5 characters!",
    "string.max": "Review title must not exceed 100 characters!",
  }),
  content: Joi.string().min(20).max(5000).required().messages({
    "string.empty": "Review content is required!",
    "string.min": "Review content must be at least 20 characters!",
    "string.max": "Review content must not exceed 5000 characters!",
  }),
  pros: Joi.string().max(2000).allow("").optional().messages({
    "string.max": "Pros must not exceed 2000 characters!",
  }),
  cons: Joi.string().max(2000).allow("").optional().messages({
    "string.max": "Cons must not exceed 2000 characters!",
  }),
}));
export const reportReview = validate(Joi.object({
  reason: Joi.string().min(5).max(500).required().messages({
    "string.empty": "Please provide a reason for reporting!",
    "string.min": "Reason must be at least 5 characters!",
    "string.max": "Reason must not exceed 500 characters!",
  }),
}));
