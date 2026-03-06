import { Router } from "express";
import multer from "multer";
import { imageStorage } from "../helpers/cloudinary.helper";
import { verifyAdminToken, requirePermission } from "../middlewares/admin-auth.middleware";
import * as adminValidate from "../validates/admin.validate";
import * as authCtrl from "../controllers/admin/auth.controller";
import * as dashboardCtrl from "../controllers/admin/dashboard.controller";
import * as candidateCtrl from "../controllers/admin/candidate.controller";
import * as companyCtrl from "../controllers/admin/company.controller";
import * as jobCtrl from "../controllers/admin/job.controller";
import * as roleCtrl from "../controllers/admin/role.controller";
import * as accountCtrl from "../controllers/admin/account.controller";
import * as profileCtrl from "../controllers/admin/profile.controller";
import { forgotPasswordLimiter, loginLimiter, otpVerifyLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();
const uploadImage = multer({ storage: imageStorage });

// ─── Auth (public) ──────────────────────────────────────────────────────────
router.post("/auth/register", adminValidate.registerPost, authCtrl.registerPost);
router.post("/auth/login", loginLimiter, adminValidate.loginPost, authCtrl.loginPost);
router.post("/auth/forgot-password", forgotPasswordLimiter, authCtrl.forgotPasswordPost);
router.post("/auth/otp-password", otpVerifyLimiter, adminValidate.otpPasswordPost, authCtrl.otpPasswordPost);
router.post("/auth/reset-password", verifyAdminToken, adminValidate.resetPasswordPost, authCtrl.resetPasswordPost);
router.post("/auth/logout", authCtrl.logout);
router.get("/auth/check", verifyAdminToken, authCtrl.checkAuth);

// ─── Profile ─────────────────────────────────────────────────────────────────
router.get("/profile", verifyAdminToken, profileCtrl.getProfile);
router.patch("/profile", verifyAdminToken, uploadImage.single("avatar"), profileCtrl.updateProfile);

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get("/dashboard", verifyAdminToken, dashboardCtrl.stats);

// ─── Candidates ──────────────────────────────────────────────────────────────
router.get("/candidates", verifyAdminToken, requirePermission("candidates_view"), candidateCtrl.list);
router.patch("/candidates/:id/verify", verifyAdminToken, requirePermission("candidates_verify"), candidateCtrl.setVerified);
router.patch("/candidates/:id/status", verifyAdminToken, requirePermission("candidates_ban"), candidateCtrl.setStatus);
router.delete("/candidates/:id", verifyAdminToken, requirePermission("candidates_delete"), candidateCtrl.deleteCandidate);

// ─── Companies ───────────────────────────────────────────────────────────────
router.get("/companies", verifyAdminToken, requirePermission("companies_view"), companyCtrl.list);
router.patch("/companies/:id/status", verifyAdminToken, requirePermission("companies_approve"), companyCtrl.setStatus);
router.delete("/companies/:id", verifyAdminToken, requirePermission("companies_delete"), companyCtrl.deleteCompany);

// ─── Jobs ────────────────────────────────────────────────────────────────────
router.get("/jobs", verifyAdminToken, requirePermission("jobs_view"), jobCtrl.list);
router.delete("/jobs/:id", verifyAdminToken, requirePermission("jobs_delete"), jobCtrl.deleteJob);

// ─── Roles ───────────────────────────────────────────────────────────────────
router.get("/roles/permissions", verifyAdminToken, requirePermission("roles_view"), roleCtrl.listPermissions);
router.get("/roles", verifyAdminToken, requirePermission("roles_view"), roleCtrl.list);
router.post("/roles", verifyAdminToken, requirePermission("roles_manage"), adminValidate.createRole, roleCtrl.create);
router.patch("/roles/:id", verifyAdminToken, requirePermission("roles_manage"), adminValidate.updateRole, roleCtrl.update);
router.delete("/roles/:id", verifyAdminToken, requirePermission("roles_manage"), roleCtrl.remove);

// ─── Admin Accounts ──────────────────────────────────────────────────────────
router.get("/accounts", verifyAdminToken, requirePermission("accounts_view"), accountCtrl.list);
router.post("/accounts", verifyAdminToken, requirePermission("accounts_manage"), adminValidate.createAccount, accountCtrl.create);
router.patch("/accounts/:id", verifyAdminToken, requirePermission("accounts_manage"), adminValidate.updateAccount, accountCtrl.update);
router.patch("/accounts/:id/status", verifyAdminToken, requirePermission("accounts_manage"), accountCtrl.setStatus);
router.patch("/accounts/:id/role", verifyAdminToken, requirePermission("accounts_manage"), accountCtrl.setRole);
router.delete("/accounts/:id", verifyAdminToken, requirePermission("accounts_manage"), accountCtrl.remove);

export default router;
