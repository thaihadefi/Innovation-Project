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

export const createPost = validate(Joi.object({
  title: Joi.string().min(5).max(150).required().messages({
    "string.empty": "Please enter a title!",
    "string.min": "Title must be at least 5 characters!",
    "string.max": "Title must not exceed 150 characters!",
  }),
  content: Joi.string().min(20).required().messages({
    "string.empty": "Please write some content!",
    "string.min": "Content is too short!",
  }),
  companyName: Joi.string().min(1).max(100).required().messages({
    "string.empty": "Please enter the company name!",
  }),
  position: Joi.string().min(1).max(100).required().messages({
    "string.empty": "Please enter the position!",
  }),
  result: Joi.string().valid("passed", "failed", "pending").required().messages({
    "any.only": "Invalid result value!",
  }),
  difficulty: Joi.string().valid("easy", "medium", "hard").required().messages({
    "any.only": "Invalid difficulty value!",
  }),
  isAnonymous: Joi.boolean().optional().default(false),
}));

export const createComment = validate(Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    "string.empty": "Comment content cannot be empty!",
    "string.max": "Comment must not exceed 2000 characters!",
  }),
  parentId: Joi.string().allow(null).optional(),
  isAnonymous: Joi.boolean().optional().default(false),
}));

export const updateComment = validate(Joi.object({
  content: Joi.string().min(1).max(2000).required().messages({
    "string.empty": "Comment content cannot be empty!",
    "string.max": "Comment must not exceed 2000 characters!",
  }),
}));

export const createReport = validate(Joi.object({
  reason: Joi.string().min(5).max(500).required().messages({
    "string.empty": "Please provide a reason for reporting!",
    "string.min": "Reason must be at least 5 characters!",
    "string.max": "Reason must not exceed 500 characters!",
  }),
}));
