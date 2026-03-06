import { Response } from "express";
import bcrypt from "bcryptjs";
import AccountAdmin from "../../models/account-admin.model";
import Role from "../../models/role.model";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.accounts;
    const skip = (page - 1) * pageSize;
    const keyword = String(req.query.keyword || "").trim();
    const status = req.query.status as string | undefined;
    const roleId = req.query.roleId as string | undefined;

    const filter: any = { deleted: false };
    if (status && ["initial", "active", "inactive"].includes(status)) filter.status = status;
    if (roleId === "none") filter.role = null;
    else if (roleId) filter.role = roleId;
    if (keyword) filter.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
    ];

    const [total, accounts] = await Promise.all([
      AccountAdmin.countDocuments(filter),
      AccountAdmin.find(filter)
        .select("fullName email phone role status isSuperAdmin createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .populate("role", "name")
        .lean(),
    ]);

    res.json({
      code: "success",
      accounts,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / pageSize)),
        currentPage: page,
        pageSize,
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const create = async (req: RequestAdmin, res: Response) => {
  try {
    const { fullName, email, password, phone, roleId } = req.body;

    const existing = await AccountAdmin.findOne({ email, deleted: false });
    if (existing) {
      res.status(400).json({ code: "error", message: "Email already exists." });
      return;
    }

    if (roleId) {
      const roleExists = await Role.findOne({ _id: roleId, deleted: false });
      if (!roleExists) {
        res.status(404).json({ code: "error", message: "Role not found." });
        return;
      }
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const account = new AccountAdmin({
      fullName,
      email,
      password: hashedPassword,
      phone: phone || "",
      role: roleId || null,
      status: "active",
      isSuperAdmin: false, // Never allow creating superadmin via API
    });
    await account.save();

    res.json({ code: "success", message: "Admin account created." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const update = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { fullName, email, phone, roleId, status, password } = req.body;

    // Prevent editing superadmin accounts
    const target = await AccountAdmin.findOne({ _id: id, deleted: false });
    if (!target) {
      res.status(404).json({ code: "error", message: "Admin account not found." });
      return;
    }
    if (target.isSuperAdmin && req.admin._id.toString() !== id) {
      res.status(403).json({ code: "error", message: "Cannot modify a superadmin account." });
      return;
    }

    // Prevent self-deactivation
    if (req.admin._id.toString() === id && status && status !== "active") {
      res.status(400).json({ code: "error", message: "Cannot deactivate your own account." });
      return;
    }

    if (email) {
      const duplicate = await AccountAdmin.findOne({ email, _id: { $ne: id }, deleted: false });
      if (duplicate) {
        res.status(400).json({ code: "error", message: "Email already in use." });
        return;
      }
    }

    if (roleId) {
      const roleExists = await Role.findOne({ _id: roleId, deleted: false });
      if (!roleExists) {
        res.status(404).json({ code: "error", message: "Role not found." });
        return;
      }
    }

    const updates: any = {};
    if (fullName) updates.fullName = fullName;
    if (email) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (roleId !== undefined) updates.role = roleId || null;
    if (status && ["initial", "active", "inactive"].includes(status)) updates.status = status;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(password, salt);
    }

    const result = await AccountAdmin.updateOne({ _id: id, deleted: false }, updates);
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Admin account not found." });
      return;
    }
    res.json({ code: "success", message: "Admin account updated." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const setStatus = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["active", "inactive", "initial"].includes(status)) {
      res.status(400).json({ code: "error", message: "Invalid status." });
      return;
    }
    // Prevent self-deactivation
    if (req.admin._id.toString() === id && status !== "active") {
      res.status(400).json({ code: "error", message: "Cannot deactivate your own account." });
      return;
    }
    // Prevent deactivating superadmin
    const target = await AccountAdmin.findOne({ _id: id, deleted: false });
    if (target?.isSuperAdmin && req.admin._id.toString() !== id) {
      res.status(403).json({ code: "error", message: "Cannot modify a superadmin account." });
      return;
    }
    const result = await AccountAdmin.updateOne({ _id: id, deleted: false }, { status });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Admin account not found." });
      return;
    }
    res.json({ code: "success", message: "Status updated." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const remove = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    if (req.admin._id.toString() === id) {
      res.status(400).json({ code: "error", message: "Cannot delete your own account." });
      return;
    }
    // Prevent deleting superadmin
    const target = await AccountAdmin.findOne({ _id: id, deleted: false });
    if (target?.isSuperAdmin) {
      res.status(403).json({ code: "error", message: "Cannot delete a superadmin account." });
      return;
    }
    const result = await AccountAdmin.updateOne({ _id: id, deleted: false }, { deleted: true });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Admin account not found." });
      return;
    }
    res.json({ code: "success", message: "Account deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const setRole = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
    // Prevent changing role of superadmin
    const target = await AccountAdmin.findOne({ _id: id, deleted: false });
    if (target?.isSuperAdmin) {
      res.status(403).json({ code: "error", message: "Cannot change the role of a superadmin account." });
      return;
    }
    if (roleId) {
      const roleExists = await Role.findOne({ _id: roleId, deleted: false });
      if (!roleExists) {
        res.status(404).json({ code: "error", message: "Role not found." });
        return;
      }
    }
    const result = await AccountAdmin.updateOne({ _id: id, deleted: false }, { role: roleId || null });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Admin account not found." });
      return;
    }
    res.json({ code: "success", message: "Role assigned." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
