import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as adminNotificationService from "../../services/admin/notification.service";

export const getNotifications = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const adminId = req.admin._id;
    const page = parsePage(req.query.page);

    const data = await adminNotificationService.getAdminNotificationsService(adminId, page);
    res.json(data);
  } catch {
    serverError(res, "Failed to get notifications.");
  }
};

export const markRead = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const adminId = req.admin._id;
    const notifId = String(req.params.id);

    const result = await adminNotificationService.markAdminNotificationReadService(adminId, notifId);
    res.status(result.status).json(result);
  } catch {
    serverError(res, "Failed to mark notification as read.");
  }
};

export const markAllRead = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const adminId = req.admin._id;
    const result = await adminNotificationService.markAllAdminNotificationsReadService(adminId);
    res.json(result);
  } catch {
    serverError(res, "Failed to mark notifications as read.");
  }
};
