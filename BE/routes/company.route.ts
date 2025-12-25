import { Router } from "express";
import * as companyController from "../controllers/company.controller";
import * as companyValidate from "../validates/company.validate";
import * as authMiddleware from "../middlewares/auth.middeware";
import multer from "multer";
import { storage } from "../helpers/cloudinary.helper";

const router = Router();

const upload = multer({ storage: storage });

router.get('/top-companies', companyController.topCompanies);

router.post(
  '/register', 
  companyValidate.registerPost,
  companyController.registerPost
)

router.post(
  '/login', 
  companyValidate.loginPost,
  companyController.loginPost
)

router.post(
  '/forgot-password',
  companyController.forgotPasswordPost
)

router.post(
  '/otp-password',
  companyController.otpPasswordPost
)

router.post(
  '/reset-password',
  authMiddleware.verifyTokenCompany,
  companyController.resetPasswordPost
)

router.patch(
  '/profile', 
  authMiddleware.verifyTokenCompany,
  upload.single("logo"),
  companyController.profilePatch
)

router.post(
  '/job/create', 
  authMiddleware.verifyTokenCompany,
  upload.array("images", 6),
  companyValidate.jobCreate,
  companyController.createJobPost
)

router.get(
  '/job/list', 
  authMiddleware.verifyTokenCompany,
  companyController.getJobList
)

router.get(
  '/job/edit/:id', 
  authMiddleware.verifyTokenCompany,
  companyController.getJobEdit
)

router.patch(
  '/job/edit/:id', 
  authMiddleware.verifyTokenCompany,
  upload.array("images", 6),
  companyController.jobEditPatch
)

router.delete(
  '/job/delete/:id', 
  authMiddleware.verifyTokenCompany,
  companyController.deleteJobDel
)

router.get('/list', companyController.list)

router.get('/detail/:slug', companyController.detail)

router.get(
  '/cv/list', 
  authMiddleware.verifyTokenCompany, 
  companyController.getCVList
)

router.get(
  '/cv/detail/:id', 
  authMiddleware.verifyTokenCompany, 
  companyController.getCVDetail
)

router.patch(
  '/cv/change-status/:id', 
  authMiddleware.verifyTokenCompany, 
  companyController.changeStatusCVPatch
)

router.delete(
  '/cv/delete/:id', 
  authMiddleware.verifyTokenCompany, 
  companyController.deleteCVDel
)

router.post(
  '/request-email-change',
  authMiddleware.verifyTokenCompany,
  companyController.requestEmailChange
)

router.post(
  '/verify-email-change',
  authMiddleware.verifyTokenCompany,
  companyController.verifyEmailChange
)

router.get(
  '/follower-count',
  authMiddleware.verifyTokenCompany,
  companyController.getFollowerCount
)

// Company notifications
router.get(
  '/notifications',
  authMiddleware.verifyTokenCompany,
  companyController.getCompanyNotifications
)

router.patch(
  '/notification/:id/read',
  authMiddleware.verifyTokenCompany,
  companyController.markCompanyNotificationRead
)

router.patch(
  '/notifications/read-all',
  authMiddleware.verifyTokenCompany,
  companyController.markAllCompanyNotificationsRead
)

export default router;