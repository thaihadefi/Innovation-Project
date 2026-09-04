import { Router } from "express";
import * as ctrl from "../controllers/interview-experience.controller";
import { verifyTokenCandidate } from "../middlewares/auth.middleware";

const router = Router();

import * as validate from "../validates/interview-experience.validate";

router.get("/", verifyTokenCandidate, ctrl.list);

router.patch("/comments/:commentId", verifyTokenCandidate, validate.updateComment, ctrl.editComment);
router.delete("/comments/:commentId", verifyTokenCandidate, ctrl.deleteComment);
router.post("/comments/:commentId/helpful", verifyTokenCandidate, ctrl.markCommentHelpful);
router.post("/comments/:commentId/report", verifyTokenCandidate, validate.createReport, ctrl.reportComment);

router.get("/:id", verifyTokenCandidate, ctrl.detail);
router.get("/:id/comments", verifyTokenCandidate, ctrl.getComments);
router.post("/", verifyTokenCandidate, validate.createPost, ctrl.create);
router.patch("/:id", verifyTokenCandidate, validate.createPost, ctrl.update);
router.delete("/:id", verifyTokenCandidate, ctrl.remove);
router.post("/:id/helpful", verifyTokenCandidate, ctrl.markHelpful);
router.post("/:id/comments", verifyTokenCandidate, validate.createComment, ctrl.createComment);

export default router;
