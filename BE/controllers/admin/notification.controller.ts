import { Response } from "express";
import Notification from "../../models/notification.model";
import { RequestAdmin } from "../../interfaces/request.interface";
import { paginationConfig } from "../../config/variable";

export const getNotifications = async (req: RequestAdmin, res: Response) => {
  try {
    const adminId = req.admin._id;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = paginationConfig.notificationsPageSize || 10;
    const skip = (page - 1) * pageSize;

    const [notifications, unreadCount, totalRecord] = await Promise.all([
      Notification.find({ adminId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select("title message link read createdAt type")
        .lean(),
      Notification.countDocuments({ adminId, read: false }),
      Notification.countDocuments({ adminId }),
    ]);

    res.json({
      code: "success",
      notifications,
      unreadCount,
      pagination: {
        totalRecord,
        totalPage: Math.max(1, Math.ceil(totalRecord / pageSize)),
        currentPage: page,
        pageSize,
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Failed to get notifications." });
  }
};

export const markRead = async (req: RequestAdmin, res: Response) => {
  try {
    const adminId = req.admin._id;
    const notifId = req.params.id;

    if (!notifId || !/^[a-fA-F0-9]{24}$/.test(notifId)) {
      res.status(400).json({ code: "error", message: "Invalid notification ID." });
      return;
    }

    await Notification.updateOne({ _id: notifId, adminId }, { read: true });

    res.json({ code: "success", message: "Notification marked as read." });
  } catch {
    res.status(500).json({ code: "error", message: "Failed to mark notification as read." });
  }
};

export const markAllRead = async (req: RequestAdmin, res: Response) => {
  try {
    const adminId = req.admin._id;

    await Notification.updateMany({ adminId, read: false }, { read: true });

    res.json({ code: "success", message: "All notifications marked as read." });
  } catch {
    res.status(500).json({ code: "error", message: "Failed to mark notifications as read." });
  }
};
