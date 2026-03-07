import { Router } from "express";
import Joi from "joi";
import { NextFunction, Request, Response } from "express";
import * as ctrl from "../controllers/interview-experience.controller";
import { verifyTokenCandidate } from "../middlewares/auth.middleware";

const router = Router();

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

const createPostValidate = validate(Joi.object({
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

router.get("/", ctrl.list);
router.get("/:id", ctrl.detail);
router.post("/", verifyTokenCandidate, createPostValidate, ctrl.create);
router.patch("/:id", verifyTokenCandidate, createPostValidate, ctrl.update);
router.delete("/:id", verifyTokenCandidate, ctrl.remove);

export default router;
