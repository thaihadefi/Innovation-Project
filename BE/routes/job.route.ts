import { Router } from "express";
import * as jobController from "../controllers/job.controller";
import * as authMiddleware from "../middlewares/auth.middleware";
import multer from "multer";
import { pdfStorage } from "../helpers/cloudinary.helper";
import { applyLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

const uploadPDF = multer({ storage: pdfStorage });

router.get("/skills", jobController.skills);

router.get("/detail/:slug", authMiddleware.verifyTokenAny, jobController.detail);

router.post(
  "/apply", 
  applyLimiter,
  authMiddleware.verifyTokenCandidate,
  uploadPDF.single("fileCV"),
  jobController.applyPost
);

router.get(
  "/check-applied/:jobId",
  authMiddleware.verifyTokenAny,
  jobController.checkApplied
);

export default router;
