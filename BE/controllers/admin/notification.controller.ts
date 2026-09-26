import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { listNotifications, markNotificationRead, markAllNotificationsRead } from "../../services/notification.service";
export const getNotifications = async (req: RequestAdmin, res: Response) => {
    const adminId = req.admin!._id;
    const page = parsePage(req.query.page);
    const data = await listNotifications({ adminId }, page);
    res.json(data);
};
export const markRead = async (req: RequestAdmin, res: Response) => {
    const adminId = req.admin!._id;
    const notifId = String(req.params.id);
    const result = await markNotificationRead({ adminId }, notifId);
    res.status(result.status).json(result);
};
export const markAllRead = async (req: RequestAdmin, res: Response) => {
    const adminId = req.admin!._id;
    const result = await markAllNotificationsRead({ adminId });
    res.json(result);
};
