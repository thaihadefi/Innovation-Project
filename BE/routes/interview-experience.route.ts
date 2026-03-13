import { Router } from "express";
import Joi from "joi";
import { NextFunction, Request, Response } from "express";
import * as ctrl from "../controllers/interview-experience.controller";
import { verifyTokenCandidate } from "../middlewares/auth.middleware";

const router = Router();

import * as validate from "../validates/interview-experience.validate";

// Schemas removed and moved to validates file

router.get("/", ctrl.list);

// Comment routes (must be before /:id to avoid conflict)
router.patch("/comments/:commentId", verifyTokenCandidate, validate.updateComment, ctrl.editComment);
router.delete("/comments/:commentId", verifyTokenCandidate, ctrl.deleteComment);
router.post("/comments/:commentId/helpful", verifyTokenCandidate, ctrl.markCommentHelpful);
router.post("/comments/:commentId/report", verifyTokenCandidate, validate.createReport, ctrl.reportComment);

router.get("/:id", ctrl.detail);
router.get("/:id/comments", ctrl.getComments);
router.post("/", verifyTokenCandidate, validate.createPost, ctrl.create);
router.patch("/:id", verifyTokenCandidate, validate.createPost, ctrl.update);
router.delete("/:id", verifyTokenCandidate, ctrl.remove);
router.post("/:id/helpful", verifyTokenCandidate, ctrl.markHelpful);
router.post("/:id/comments", verifyTokenCandidate, validate.createComment, ctrl.createComment);

export default router;
