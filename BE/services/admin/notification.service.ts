import { Types } from "mongoose";
import Notification from "../../models/notification.model";
import { paginationConfig } from "../../config/variable";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { INotification } from "../../interfaces/models/notification.interface";

export const getAdminNotificationsService = async (
  adminId: Types.ObjectId,
  page: number
): Promise<{
  code: string;
  notifications: INotification[];
  unreadCount: number;
  pagination: PaginationDTO;
}> => {
  const pageSize = paginationConfig.notificationsPageSize || 10;
  const skip = (page - 1) * pageSize;

  const [notifications, unreadCount, totalRecord] = await Promise.all([
    Notification.find({ adminId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("title message link read createdAt type")
      .lean<INotification[]>(),
    Notification.countDocuments({ adminId, read: false }),
    Notification.countDocuments({ adminId }),
  ]);

  return {
    code: "success",
    notifications,
    unreadCount,
    pagination: buildPagination(totalRecord, page, pageSize),
  };
};

export const markAdminNotificationReadService = async (
  adminId: Types.ObjectId,
  notifId: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!notifId || !/^[a-fA-F0-9]{24}$/.test(notifId)) {
    return { status: 400, code: "error", message: "Invalid notification ID." };
  }

  await Notification.updateOne({ _id: notifId, adminId }, { read: true });
  return { status: 200, code: "success", message: "Notification marked as read." };
};

export const markAllAdminNotificationsReadService = async (
  adminId: Types.ObjectId
): Promise<{ code: string; message: string }> => {
  await Notification.updateMany({ adminId, read: false }, { read: true });
  return { code: "success", message: "All notifications marked as read." };
};
