import { Request, Response } from "express";
import { RequestAdmin } from "../../interfaces/request.interface";
import { getAuthCookieOptions } from "../../helpers/cookie.helper";
import { setNoCacheHeaders, unauthorized, serverError } from "../../helpers/response.helper";
import * as adminAuthService from "../../services/admin/auth.service";

export const registerPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as adminAuthService.AdminRegisterDTO;
    const result = await adminAuthService.registerAdminService(body);
    res.status(result.status).json({ code: result.code, message: result.message });
  } catch {
    serverError(res);
  }
};

export const loginPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as { email?: string; password?: string; rememberPassword?: boolean };
    const result = await adminAuthService.loginAdminService(
      String(body.email || ""),
      String(body.password || ""),
      body.rememberPassword
    );

    if (result.token) {
      const maxAge = body.rememberPassword ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
      res.cookie("adminToken", result.token, getAuthCookieOptions(req, maxAge));
    }

    res.status(result.status).json({ code: result.code, message: result.message });
  } catch {
    serverError(res);
  }
};

export const forgotPasswordPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as { email?: string };
    const result = await adminAuthService.forgotPasswordAdminService(String(body.email || ""));
    res.status(result.status).json({ code: result.code, message: result.message });
  } catch {
    serverError(res);
  }
};

export const otpPasswordPost = async (req: Request, res: Response): Promise<void> => {
  try {
    const body = req.body as { email?: string; otp?: string };
    const result = await adminAuthService.verifyOtpAdminService(
      String(body.email || ""),
      String(body.otp || "")
    );

    if (result.token) {
      res.cookie("adminToken", result.token, getAuthCookieOptions(req, 24 * 60 * 60 * 1000));
    }

    res.status(result.status).json({ code: result.code, message: result.message });
  } catch {
    serverError(res);
  }
};

export const resetPasswordPost = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const body = req.body as { password?: string };
    const result = await adminAuthService.resetPasswordAdminService(
      req.admin._id.toString(),
      String(body.password || "")
    );

    if (result.status === 200) {
      res.clearCookie("adminToken", getAuthCookieOptions(req));
    }

    res.status(result.status).json({ code: result.code, message: result.message });
  } catch {
    serverError(res);
  }
};

export const logout = (req: Request, res: Response): void => {
  setNoCacheHeaders(res);
  res.clearCookie("adminToken", getAuthCookieOptions(req));
  res.json({ code: "success", message: "Logged out." });
};

export const checkAuth = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    setNoCacheHeaders(res, true);
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const result = await adminAuthService.checkAdminAuthService(req.admin, req.permissions ?? undefined);
    res.json(result);
  } catch {
    serverError(res);
  }
};
