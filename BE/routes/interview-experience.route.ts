import { Router } from "express";
import * as ctrl from "../controllers/interview-experience.controller";
import * as validate from "../validates/interview-experience.validate";
import { verifyTokenCandidate, requireVerifiedCandidate } from "../middlewares/auth.middleware";

const router = Router();

const canAccess = requireVerifiedCandidate("access interview experiences");
const canPost = requireVerifiedCandidate("post interview experiences");
const canComment = requireVerifiedCandidate("post comments");
const canManageComments = requireVerifiedCandidate("manage comments");

router.get("/", verifyTokenCandidate, canAccess, ctrl.list);

router.patch("/comments/:commentId", verifyTokenCandidate, canManageComments, validate.updateComment, ctrl.editComment);
router.delete("/comments/:commentId", verifyTokenCandidate, canManageComments, ctrl.deleteComment);
router.post("/comments/:commentId/helpful", verifyTokenCandidate, canAccess, ctrl.markCommentHelpful);
router.post("/comments/:commentId/report", verifyTokenCandidate, validate.createReport, ctrl.reportComment);

router.get("/:id", verifyTokenCandidate, canAccess, ctrl.detail);
router.get("/:id/comments", verifyTokenCandidate, canAccess, ctrl.getComments);
router.post("/", verifyTokenCandidate, canPost, validate.createPost, ctrl.create);
router.patch("/:id", verifyTokenCandidate, canPost, validate.createPost, ctrl.update);
router.delete("/:id", verifyTokenCandidate, canPost, ctrl.remove);
router.post("/:id/helpful", verifyTokenCandidate, canAccess, ctrl.markHelpful);
router.post("/:id/comments", verifyTokenCandidate, canComment, validate.createComment, ctrl.createComment);

export default router;
