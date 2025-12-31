import { Router } from "express";
import * as reviewController from "../controllers/review.controller";
import * as authMiddleware from "../middlewares/auth.middeware";

const router = Router();

// Public routes
router.get("/company/:companyId", reviewController.getCompanyReviews);

// Protected routes (candidate only)
router.post(
  "/create",
  authMiddleware.verifyTokenCandidate,
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

export default router;
