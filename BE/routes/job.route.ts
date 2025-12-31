import { Router } from "express";
import * as jobController from "../controllers/job.controller";
import * as authMiddleware from "../middlewares/auth.middeware";
import multer from "multer";
import { pdfStorage } from "../helpers/cloudinary.helper";

const router = Router();

// Use pdfStorage for CV uploads - only allows PDF files
const uploadPDF = multer({ storage: pdfStorage });

router.get("/technologies", jobController.technologies);

router.get("/detail/:slug", authMiddleware.verifyTokenAny, jobController.detail);

// Apply job requires candidate login to track CV submissions by account email
router.post(
  "/apply", 
  authMiddleware.verifyTokenCandidate,
  uploadPDF.single("fileCV"),
  jobController.applyPost
);

// Check if candidate already applied to a job (works for all account types)
router.get(
  "/check-applied/:jobId",
  authMiddleware.verifyTokenAny,
  jobController.checkApplied
);

export default router;