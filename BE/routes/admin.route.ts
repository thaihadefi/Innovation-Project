import { Router } from "express";
import { verifyAdminToken, requirePermission } from "../middlewares/admin-auth.middleware";
import * as adminValidate from "../validates/admin.validate";
import * as authCtrl from "../controllers/admin/auth.controller";
import * as dashboardCtrl from "../controllers/admin/dashboard.controller";
import * as candidateCtrl from "../controllers/admin/candidate.controller";
import * as companyCtrl from "../controllers/admin/company.controller";
import * as jobCtrl from "../controllers/admin/job.controller";
import * as roleCtrl from "../controllers/admin/role.controller";
import * as accountCtrl from "../controllers/admin/account.controller";
import { forgotPasswordLimiter, loginLimiter, otpVerifyLimiter } from "../middlewares/rate-limit.middleware";

const router = Router();

// ─── Auth (public) ──────────────────────────────────────────────────────────
router.post("/auth/register", adminValidate.registerPost, authCtrl.registerPost);
router.post("/auth/login", loginLimiter, adminValidate.loginPost, authCtrl.loginPost);
router.post("/auth/forgot-password", forgotPasswordLimiter, authCtrl.forgotPasswordPost);
router.post("/auth/otp-password", otpVerifyLimiter, adminValidate.otpPasswordPost, authCtrl.otpPasswordPost);
router.post("/auth/reset-password", verifyAdminToken, adminValidate.resetPasswordPost, authCtrl.resetPasswordPost);
router.post("/auth/logout", authCtrl.logout);
router.get("/auth/check", verifyAdminToken, authCtrl.checkAuth);

// ─── Dashboard ───────────────────────────────────────────────────────────────
router.get("/dashboard", verifyAdminToken, dashboardCtrl.stats);

// ─── Candidates ──────────────────────────────────────────────────────────────
router.get("/candidates", verifyAdminToken, requirePermission("candidates_view"), candidateCtrl.list);
router.patch("/candidates/:id/verify", verifyAdminToken, requirePermission("candidates_verify"), candidateCtrl.setVerified);
router.patch("/candidates/:id/status", verifyAdminToken, requirePermission("candidates_ban"), candidateCtrl.setStatus);

// ─── Companies ───────────────────────────────────────────────────────────────
router.get("/companies", verifyAdminToken, requirePermission("companies_view"), companyCtrl.list);
router.patch("/companies/:id/status", verifyAdminToken, requirePermission("companies_approve"), companyCtrl.setStatus);

// ─── Jobs ────────────────────────────────────────────────────────────────────
router.get("/jobs", verifyAdminToken, requirePermission("jobs_view"), jobCtrl.list);
router.delete("/jobs/:id", verifyAdminToken, requirePermission("jobs_delete"), jobCtrl.deleteJob);

// ─── Roles ───────────────────────────────────────────────────────────────────
router.get("/roles/permissions", verifyAdminToken, requirePermission("roles_view"), roleCtrl.listPermissions);
router.get("/roles", verifyAdminToken, requirePermission("roles_view"), roleCtrl.list);
router.post("/roles", verifyAdminToken, requirePermission("roles_manage"), roleCtrl.create);
router.patch("/roles/:id", verifyAdminToken, requirePermission("roles_manage"), roleCtrl.update);
router.delete("/roles/:id", verifyAdminToken, requirePermission("roles_manage"), roleCtrl.remove);

// ─── Admin Accounts ──────────────────────────────────────────────────────────
router.get("/accounts", verifyAdminToken, requirePermission("accounts_view"), accountCtrl.list);
router.patch("/accounts/:id/status", verifyAdminToken, requirePermission("accounts_manage"), accountCtrl.setStatus);
router.patch("/accounts/:id/role", verifyAdminToken, requirePermission("accounts_manage"), accountCtrl.setRole);

export default router;
