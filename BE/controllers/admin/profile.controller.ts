import { Response } from "express";
import AccountAdmin from "../../models/account-admin.model";
import { RequestAdmin } from "../../interfaces/request.interface";
import { deleteImage } from "../../helpers/cloudinary.helper";

export const getProfile = async (req: RequestAdmin, res: Response) => {
  try {
    const admin = await AccountAdmin.findById(req.admin._id)
      .select("fullName email phone avatar role status createdAt")
      .populate("role", "name")
      .lean();
    if (!admin) {
      res.status(404).json({ code: "error", message: "Admin not found." });
      return;
    }
    res.json({ code: "success", info: admin });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const updateProfile = async (req: RequestAdmin, res: Response) => {
  try {
    const adminId = req.admin._id;
    const { fullName, phone } = req.body;

    const needOldAvatar = !!req.file || req.body.avatar === "" || req.body.avatar === null;

    // Run uniqueness check and old avatar fetch in parallel
    const [current, existPhone] = await Promise.all([
      needOldAvatar
        ? AccountAdmin.findById(adminId).select("avatar").lean()
        : Promise.resolve(null),
      phone
        ? AccountAdmin.findOne({ _id: { $ne: adminId }, phone, deleted: false }).select("_id").lean()
        : Promise.resolve(null),
    ]);

    if (existPhone) {
      if (req.file) void deleteImage(req.file.path).catch(() => {});
      res.status(409).json({ code: "error", message: "Phone number already exists." });
      return;
    }

    const updates: any = {};
    if (fullName) updates.fullName = fullName;
    if (phone !== undefined) updates.phone = phone;

    if (req.file) {
      updates.avatar = req.file.path;
    } else if (req.body.avatar === "" || req.body.avatar === null) {
      updates.avatar = null;
    }

    await AccountAdmin.updateOne({ _id: adminId }, updates);

    // Delete old avatar from Cloudinary if replaced or removed
    const oldAvatar = (current as any)?.avatar as string | undefined;
    if (oldAvatar) {
      const isReplaced = req.file && oldAvatar !== req.file.path;
      const isRemoved = !req.file && (req.body.avatar === "" || req.body.avatar === null);
      if (isReplaced || isRemoved) {
        void deleteImage(oldAvatar).catch((err) => console.error('[Cloudinary] Failed to delete:', err));
      }
    }

    res.json({ code: "success", message: "Profile updated." });
  } catch {
    // Roll back Cloudinary upload if DB write failed
    if (req.file) {
      void deleteImage(req.file.path).catch((e) => console.error('[Cloudinary] Failed to delete orphaned upload:', e));
    }
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
