import { Types } from "mongoose";
import Notification from "../models/notification.model";
import { paginationConfig } from "../config/variable";
import { buildPagination, PaginationDTO } from "../helpers/pagination.helper";
import { isObjectId } from "../helpers/db.helper";

/** { candidateId } | { companyId } | { adminId } — the owner scope of an inbox. */
export type NotificationOwner = Record<string, Types.ObjectId>;

export const listNotifications = async (
  owner: NotificationOwner,
  page: number
): Promise<{ code: string; notifications: unknown[]; unreadCount: number; pagination: PaginationDTO }> => {
  const pageSize = paginationConfig.notificationsPageSize || 10;
  const skip = (page - 1) * pageSize;

  const [notifications, unreadCount, totalRecord] = await Promise.all([
    Notification.find(owner)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("title message link read createdAt type")
      .lean(),
    Notification.countDocuments({ ...owner, read: false }),
    Notification.countDocuments(owner),
  ]);

  return {
    code: "success",
    notifications,
    unreadCount,
    pagination: buildPagination(totalRecord, page, pageSize),
  };
};

export const markNotificationRead = async (
  owner: NotificationOwner,
  notifId: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!isObjectId(notifId)) {
    return { status: 400, code: "error", message: "Invalid notification ID." };
  }

  await Notification.updateOne({ _id: notifId, ...owner }, { read: true });
  return { status: 200, code: "success", message: "Notification marked as read." };
};

export const markAllNotificationsRead = async (
  owner: NotificationOwner
): Promise<{ code: string; message: string }> => {
  await Notification.updateMany({ ...owner, read: false }, { read: true });
  return { code: "success", message: "All notifications marked as read." };
};
