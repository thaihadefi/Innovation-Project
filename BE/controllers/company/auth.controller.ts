import { Request, Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { getAuthCookieOptions } from "../../helpers/cookie.helper";
import * as companyAuthService from "../../services/company/auth.service";
export const registerPost = async (req: Request, res: Response) => {
    const body = req.body as companyAuthService.CompanyRegisterDTO;
    const result = await companyAuthService.registerCompanyService(body);
    res.status(result.status).json({ code: result.code, message: result.message });
};
export const loginPost = async (req: Request, res: Response) => {
    const body = req.body as {
        email?: string;
        password?: string;
        rememberPassword?: boolean;
    };
    const result = await companyAuthService.loginCompanyService(String(body.email || ""), String(body.password || ""), body.rememberPassword);
    if (result.token) {
        const maxAge = body.rememberPassword ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
        res.cookie("token", result.token, getAuthCookieOptions(req, maxAge));
    }
    res.status(result.status).json({ code: result.code, message: result.message });
};
export const forgotPasswordPost = async (req: Request, res: Response) => {
    const body = req.body as {
        email?: string;
    };
    const result = await companyAuthService.forgotPasswordCompanyService(String(body.email || ""));
    res.status(result.status).json({ code: result.code, message: result.message });
};
export const otpPasswordPost = async (req: Request, res: Response) => {
    const body = req.body as {
        email?: string;
        otp?: string;
    };
    const result = await companyAuthService.verifyOtpCompanyService(String(body.email || ""), String(body.otp || ""));
    if (result.token) {
        res.cookie("token", result.token, getAuthCookieOptions(req, 24 * 60 * 60 * 1000));
    }
    res.status(result.status).json({ code: result.code, message: result.message });
};
export const resetPasswordPost = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const body = req.body as {
        password?: string;
    };
    const result = await companyAuthService.resetPasswordCompanyService(company._id.toString(), String(body.password || ""));
    if (result.status === 200) {
        res.clearCookie("token", getAuthCookieOptions(req));
    }
    res.status(result.status).json({ code: result.code, message: result.message });
};
