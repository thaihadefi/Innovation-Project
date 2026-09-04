import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import { listNotifications, markNotificationRead as markRead, markAllNotificationsRead as markAllRead } from "../../services/notification.service";
// All routes here are behind verifyTokenCandidate, so req.account is a candidate.
export const getNotifications = async (req: RequestAccount, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const page = parsePage(req.query.page);
    const data = await listNotifications({ candidateId: candidate._id }, page);
    res.json(data);
};
export const markNotificationRead = async (req: RequestAccount, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const notificationId = String(req.params.notificationId);
    const result = await markRead({ candidateId: candidate._id }, notificationId);
    res.status(result.status).json(result);
};
export const markAllNotificationsRead = async (req: RequestAccount, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const result = await markAllRead({ candidateId: candidate._id });
    res.json(result);
};
