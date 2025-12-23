import { Router } from "express";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.get('/check', authController.check)

router.get('/logout', authController.logout)

export default router;