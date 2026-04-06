import { Response } from "express";
import Role, { ALL_PERMISSIONS } from "../../models/role.model";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";

export const listPermissions = (_req: RequestAdmin, res: Response) => {
  res.json({ code: "success", permissions: ALL_PERMISSIONS });
};

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.roles;
    const skip = (page - 1) * pageSize;
    const keyword = String(req.query.keyword || "").trim();

    const filter: any = { deleted: false };
    if (keyword) filter.$or = [
      { name: { $regex: keyword, $options: "i" } },
    ];

    const [total, roles] = await Promise.all([
      Role.countDocuments(filter),
      Role.find(filter)
        .select("name description permissions createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      code: "success",
      roles,
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
    const { name, description, permissions } = req.body;
    if (!name || typeof name !== "string") {
      res.status(400).json({ code: "error", message: "Role name is required." });
      return;
    }
    const validPerms = (permissions || []).filter((p: string) => (ALL_PERMISSIONS as readonly string[]).includes(p));
    const role = new Role({ name: name.trim(), description, permissions: validPerms });
    await role.save();
    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: "role.create",
      targetId: role._id.toString(),
      targetType: "Role",
      detail: { name, permissions: validPerms },
    });
    res.json({ code: "success", message: "Role created.", role });
  } catch (error: any) {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const update = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { name, description, permissions } = req.body;
    const update: any = {};
    if (name) update.name = name.trim();
    if (description !== undefined) update.description = description;
    if (permissions) update.permissions = (permissions as string[]).filter(p => (ALL_PERMISSIONS as readonly string[]).includes(p));

    const result = await Role.updateOne({ _id: id, deleted: false }, update);
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Role not found." });
      return;
    }
    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: "role.update",
      targetId: id,
      targetType: "Role",
      detail: update,
    });
    res.json({ code: "success", message: "Role updated." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const remove = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const role = await Role.findOneAndUpdate({ _id: id, deleted: false }, { deleted: true }).select("name").lean();
    if (!role) {
      res.status(404).json({ code: "error", message: "Role not found." });
      return;
    }
    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: "role.delete",
      targetId: id,
      targetType: "Role",
      detail: { name: (role as any).name },
    });
    res.json({ code: "success", message: "Role deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
