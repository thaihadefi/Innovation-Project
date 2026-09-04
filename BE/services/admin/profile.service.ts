import { Types } from "mongoose";
import AccountAdmin from "../../models/account-admin.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { IAccountAdmin } from "../../interfaces/models/account-admin.interface";

export const getAdminProfileService = async (
  adminId: Types.ObjectId
): Promise<{ status: number; code: string; message?: string; info?: unknown }> => {
  const admin = await AccountAdmin.findById(adminId)
    .select("fullName email phone avatar role status createdAt")
    .populate("role", "name")
    .lean();

  if (!admin) {
    return { status: 404, code: "error", message: "Admin not found." };
  }

  return { status: 200, code: "success", info: admin };
};

export const updateAdminProfileService = async (
  adminId: Types.ObjectId,
  data: { fullName?: string; phone?: string; avatar?: string | null },
  file?: { path: string }
): Promise<{ status: number; code: string; message: string }> => {
  const { fullName, phone, avatar } = data;
  const needOldAvatar = !!file || avatar === "" || avatar === null;

  const [current, existPhone] = await Promise.all([
    needOldAvatar
      ? AccountAdmin.findById(adminId).select("avatar").lean<Pick<IAccountAdmin, "avatar">>()
      : Promise.resolve(null),
    phone
      ? AccountAdmin.findOne({ _id: { $ne: adminId }, phone, deleted: false }).select("_id").lean()
      : Promise.resolve(null),
  ]);

  if (existPhone) {
    if (file) void deleteImage(file.path).catch(() => {});
    return { status: 409, code: "error", message: "Phone number already exists." };
  }

  const updates: Partial<IAccountAdmin> = {};
  if (fullName) updates.fullName = fullName;
  if (phone !== undefined) updates.phone = phone;

  if (file) {
    updates.avatar = file.path;
  } else if (avatar === "" || avatar === null) {
    updates.avatar = undefined;
  }

  try {
    await AccountAdmin.updateOne({ _id: adminId }, updates);

    const oldAvatar = current?.avatar;
    if (oldAvatar) {
      const isReplaced = file && oldAvatar !== file.path;
      const isRemoved = !file && (avatar === "" || avatar === null);
      if (isReplaced || isRemoved) {
        void deleteImage(oldAvatar).catch((err) => console.error("[Cloudinary] Failed to delete:", err));
      }
    }

    return { status: 200, code: "success", message: "Profile updated." };
  } catch (error: unknown) {
    if (file) {
      void deleteImage(file.path).catch((e) => console.error("[Cloudinary] Failed to delete orphaned upload:", e));
    }
    throw error;
  }
};
