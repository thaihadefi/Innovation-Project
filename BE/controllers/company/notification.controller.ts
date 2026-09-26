import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { listNotifications, markNotificationRead as markRead, markAllNotificationsRead as markAllRead } from "../../services/notification.service";
// All routes here are behind verifyTokenCompany, so req.account is a company.
export const getCompanyNotifications = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const page = parsePage(req.query.page);
    const data = await listNotifications({ companyId: company._id }, page);
    res.json(data);
};
export const markCompanyNotificationRead = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const notifId = String(req.params.id);
    const result = await markRead({ companyId: company._id }, notifId);
    res.status(result.status).json(result);
};
export const markAllCompanyNotificationsRead = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const result = await markAllRead({ companyId: company._id });
    res.json(result);
};
