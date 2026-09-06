import { Router } from "express";
import passport from "passport";
import * as authController from "../controllers/auth.controller";

const router = Router();

router.get('/check', authController.check);

router.post('/logout', authController.logout);

router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3069"}/candidate/login?error=oauth_failed`,
  }),
  authController.googleCallback
);

export default router;

