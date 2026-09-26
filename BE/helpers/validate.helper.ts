import { NextFunction, Request, Response } from "express";
import Joi from "joi";

/**
 * Express middleware factory: validates req.body against a Joi schema, responds
 * 400 with the first error message on failure, and replaces req.body with the
 * sanitized value on success. Replaces the hand-rolled validate wrapper that was
 * duplicated across every validates/*.ts module.
 */
export const validateBody = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ code: "error", message: error.details[0].message });
      return;
    }
    req.body = value;
    next();
  };
};
