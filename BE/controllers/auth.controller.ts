import { Request, Response } from "express";
import { getAuthCookieOptions } from "../helpers/cookie.helper";
import { setNoCacheHeaders, unauthorized, serverError } from "../helpers/response.helper";
import * as authService from "../services/auth.service";

export const check = async (req: Request, res: Response): Promise<void> => {
  try {
    setNoCacheHeaders(res, true);

    const token = req.cookies.token as string | undefined;
    const result = await authService.checkAuthToken(token);

    if (!result.valid) {
      res.clearCookie("token", getAuthCookieOptions(req));
      unauthorized(res, "Invalid token.");
      return;
    }

    if (result.accountType === "candidate" && result.infoCandidate) {
      res.json({
        code: "success",
        message: "Valid token.",
        infoCandidate: result.infoCandidate
      });
      return;
    }

    if (result.accountType === "company" && result.infoCompany) {
      res.json({
        code: "success",
        message: "Valid token.",
        infoCompany: result.infoCompany
      });
      return;
    }

    res.clearCookie("token", getAuthCookieOptions(req));
    unauthorized(res, "Invalid token.");
  } catch {
    res.clearCookie("token", getAuthCookieOptions(req));
    unauthorized(res, "Invalid token.");
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    setNoCacheHeaders(res);
    res.clearCookie("token", getAuthCookieOptions(req));
    res.json({
      code: "success",
      message: "Logged out."
    });
  } catch {
    serverError(res, "Failed to logout.");
  }
};
