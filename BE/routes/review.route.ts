import { Router } from "express";
import * as reviewController from "../controllers/review.controller";
import * as authMiddleware from "../middlewares/auth.middleware";
import * as validate from "../validates/review.validate";

const router = Router();

// Public routes
router.get("/company/:companyId", reviewController.getCompanyReviews);

// Report review (any logged-in user: candidate or company)
router.post(
  "/:reviewId/report",
  authMiddleware.verifyTokenAny,
  validate.reportReview,
  reviewController.reportReview
);

// Protected routes (candidate only)
router.post(
  "/create",
  authMiddleware.verifyTokenCandidate,
  validate.createReview,
  reviewController.createReview
);

router.post(
  "/:reviewId/helpful",
  authMiddleware.verifyTokenCandidate,
  reviewController.markHelpful
);

router.get(
  "/my-reviews",
  authMiddleware.verifyTokenCandidate,
  reviewController.getMyReviews
);

router.get(
  "/can-review/:companyId",
  authMiddleware.verifyTokenCandidate,
  reviewController.canReview
);

router.delete(
  "/:reviewId",
  authMiddleware.verifyTokenCandidate,
  reviewController.deleteReview
);

router.patch(
  "/:reviewId",
  authMiddleware.verifyTokenCandidate,
  validate.updateReview,
  reviewController.updateReview
);

export default router;
