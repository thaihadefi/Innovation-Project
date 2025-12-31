import { Router } from "express";
import * as candidateController from "../controllers/candidate.controller";
import * as candidateValidate from "../validates/candidate.validate";
import * as authMiddleware from "../middlewares/auth.middeware";
import multer from "multer";
import { imageStorage, pdfStorage } from "../helpers/cloudinary.helper";

const router = Router();

// Use imageStorage for profile photo uploads - only allows image files
const uploadImage = multer({ storage: imageStorage });
// Use pdfStorage for CV uploads - only allows PDF files
const uploadPDF = multer({ storage: pdfStorage });

router.post(
  '/register', 
  candidateValidate.registerPost,
  candidateController.registerPost
)

router.post(
  '/verify-register',
  candidateController.verifyRegisterOtp
)

router.post(
  '/login', 
  candidateValidate.loginPost,
  candidateController.loginPost
)

router.post(
  '/forgot-password',
  candidateController.forgotPasswordPost
)

router.post(
  '/otp-password',
  candidateController.otpPasswordPost
)

router.post(
  '/reset-password',
  authMiddleware.verifyTokenCandidate,
  candidateController.resetPasswordPost
)

router.patch(
  '/profile', 
  authMiddleware.verifyTokenCandidate,
  uploadImage.single("avatar"),
  candidateValidate.profilePatch,
  candidateController.profilePatch
)

router.get(
  '/cv/list', 
  authMiddleware.verifyTokenCandidate,
  candidateController.getCVList
)

router.get(
  '/cv/detail/:id', 
  authMiddleware.verifyTokenCandidate,
  candidateController.getCVDetail
)

router.patch(
  '/cv/edit/:id', 
  authMiddleware.verifyTokenCandidate,
  uploadPDF.single("fileCV"),
  candidateController.updateCVPatch
)

router.delete(
  '/cv/delete/:id', 
  authMiddleware.verifyTokenCandidate,
  candidateController.deleteCVDel
)

router.post(
  '/request-email-change',
  authMiddleware.verifyTokenCandidate,
  candidateController.requestEmailChange
)

router.post(
  '/verify-email-change',
  authMiddleware.verifyTokenCandidate,
  candidateController.verifyEmailChange
)

// Follow Company Routes
router.post(
  '/follow/:companyId',
  authMiddleware.verifyTokenCandidate,
  candidateController.toggleFollowCompany
)

router.get(
  '/follow/check/:companyId',
  authMiddleware.verifyTokenCandidate,
  candidateController.checkFollowStatus
)

router.get(
  '/followed-companies',
  authMiddleware.verifyTokenCandidate,
  candidateController.getFollowedCompanies
)

// Notification Routes
router.get(
  '/notifications',
  authMiddleware.verifyTokenCandidate,
  candidateController.getNotifications
)

router.patch(
  '/notification/:notificationId/read',
  authMiddleware.verifyTokenCandidate,
  candidateController.markNotificationRead
)

router.patch(
  '/notifications/read-all',
  authMiddleware.verifyTokenCandidate,
  candidateController.markAllNotificationsRead
)

// Saved Jobs Routes
router.post(
  '/job/save/:jobId',
  authMiddleware.verifyTokenCandidate,
  candidateController.toggleSaveJob
)

router.get(
  '/job/save/check/:jobId',
  authMiddleware.verifyTokenCandidate,
  candidateController.checkSaveStatus
)

router.get(
  '/job/saved',
  authMiddleware.verifyTokenCandidate,
  candidateController.getSavedJobs
)

// Job Recommendations Route
router.get(
  '/recommendations',
  authMiddleware.verifyTokenCandidate,
  candidateController.getRecommendations
)

export default router;