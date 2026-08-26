import Role from "../models/role.model";
import AccountAdmin from "../models/account-admin.model";
import Notification from "../models/notification.model";
import { notifyAdmin } from "./socket.helper";
import { IRole } from "../interfaces/models/role.interface";
import { IAccountAdmin } from "../interfaces/models/account-admin.interface";
import { NotificationType } from "../interfaces/models/notification.interface";

export interface AdminNotificationPayload {
  title: string;
  message: string;
  link: string;
  type?: NotificationType;
}

export const notifyAdminsWithPermissions = (
  permissions: string[],
  payload: AdminNotificationPayload
): void => {
  (async () => {
    try {
      const roles = await Role.find({
        deleted: false,
        permissions: { $in: permissions },
      })
        .select("_id")
        .lean<Pick<IRole, "_id">[]>();

      const roleIds = roles.map((r) => r._id);

      const admins = await AccountAdmin.find({
        status: "active",
        deleted: false,
        $or: [{ isSuperAdmin: true }, { role: { $in: roleIds } }],
      })
        .select("_id")
        .lean<Pick<IAccountAdmin, "_id">[]>();

      const notifDocs = admins.map((admin) => ({
        adminId: admin._id,
        type: payload.type || "other",
        title: payload.title,
        message: payload.message,
        link: payload.link,
        read: false,
      }));

      if (notifDocs.length > 0) {
        const inserted = await Notification.insertMany(notifDocs);
        inserted.forEach((notif) => {
          if (notif.adminId) {
            notifyAdmin(notif.adminId.toString(), notif);
          }
        });
      }
    } catch (error) {
      console.error("[AdminNotification] Broadcast error:", error);
    }
  })();
};
