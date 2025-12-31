import { Router } from "express";
import * as salaryController from "../controllers/salary.controller";

const router = Router();

// Public endpoint - no auth required
router.get("/insights", salaryController.getSalaryInsights);

export default router;
