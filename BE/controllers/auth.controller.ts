import { Request, Response } from "express";
import { getAuthCookieOptions } from "../helpers/cookie.helper";
import { setNoCacheHeaders, unauthorized } from "../helpers/response.helper";
import * as authService from "../services/auth.service";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { signAuthToken } from "../helpers/jwt.helper";

export const check = async (req: Request, res: Response): Promise<void> => {
    setNoCacheHeaders(res, true);
    try {
        const token = req.cookies.token as string | undefined;
        const result = await authService.checkAuthToken(token);
        if (result.valid && result.accountType === "candidate" && result.infoCandidate) {
            res.json({ code: "success", message: "Valid token.", infoCandidate: result.infoCandidate });
            return;
        }
        if (result.valid && result.accountType === "company" && result.infoCompany) {
            res.json({ code: "success", message: "Valid token.", infoCompany: result.infoCompany });
            return;
        }
    }
    catch {
        // fall through to the invalid-token response below
    }
    res.clearCookie("token", getAuthCookieOptions(req));
    unauthorized(res, "Invalid token.");
};

export const logout = async (req: Request, res: Response) => {
    setNoCacheHeaders(res);
    res.clearCookie("token", getAuthCookieOptions(req));
    res.json({ code: "success", message: "Logged out." });
};

export const googleCallback = async (req: Request, res: Response): Promise<void> => {
    const candidate = req.user as IAccountCandidate | undefined;
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3069";

    if (!candidate) {
        res.redirect(`${frontendUrl}/candidate/login?error=oauth_failed`);
        return;
    }

    const token = signAuthToken(
        {
            id: candidate._id.toString(),
            email: candidate.email,
            role: "candidate",
        },
        true
    );

    const maxAge = 7 * 24 * 60 * 60 * 1000;
    res.cookie("token", token, getAuthCookieOptions(req, maxAge));

    res.redirect(`${frontendUrl}/candidate-manage/profile`);
};
