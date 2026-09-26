import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { getAuthCookieOptions } from "../../helpers/cookie.helper";
import * as companyProfileService from "../../services/company/profile.service";
export const profilePatch = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const body = req.body as companyProfileService.CompanyProfileUpdateDTO;
    const result = await companyProfileService.updateCompanyProfileService(company, body, req.file ? { path: req.file.path } : undefined);
    res.status(result.status).json({ code: result.code, message: result.message });
};
export const requestEmailChange = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const body = req.body as {
        newEmail?: string;
    };
    const result = await companyProfileService.requestCompanyEmailChangeService(company, String(body.newEmail || ""));
    res.status(result.status).json({ code: result.code, message: result.message });
};
export const verifyEmailChange = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const body = req.body as {
        otp?: string;
    };
    const result = await companyProfileService.verifyCompanyEmailChangeService(company._id, String(body.otp || ""));
    if (result.status === 200) {
        res.clearCookie("token", getAuthCookieOptions(req));
    }
    res.status(result.status).json({ code: result.code, message: result.message });
};
