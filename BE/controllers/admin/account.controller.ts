import { Response } from "express";
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

    const filter: any = { deleted: false };
    if (status && ["initial", "active", "inactive"].includes(status)) filter.status = status;
    if (keyword) filter.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
    ];

    const [total, accounts] = await Promise.all([
      AccountAdmin.countDocuments(filter),
      AccountAdmin.find(filter)
        .select("fullName email phone role status createdAt")
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

export const setRole = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { roleId } = req.body;
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
