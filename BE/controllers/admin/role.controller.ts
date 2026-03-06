import { Response } from "express";
import Role, { ALL_PERMISSIONS } from "../../models/role.model";
import { RequestAdmin } from "../../interfaces/request.interface";

export const listPermissions = (_req: RequestAdmin, res: Response) => {
  res.json({ code: "success", permissions: ALL_PERMISSIONS });
};

export const list = async (_req: RequestAdmin, res: Response) => {
  try {
    const roles = await Role.find({ deleted: false }).select("name description permissions createdAt").lean();
    res.json({ code: "success", roles });
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
    res.json({ code: "success", message: "Role updated." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const remove = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Role.updateOne({ _id: id, deleted: false }, { deleted: true });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Role not found." });
      return;
    }
    res.json({ code: "success", message: "Role deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
