import { FilterQuery, Types } from "mongoose";
import Role, { ALL_PERMISSIONS } from "../../models/role.model";
import { adminPaginationConfig } from "../../config/variable";
import { AUDIT_ACTIONS } from "../../config/audit-actions";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";
import { buildRegexFilter } from "../../helpers/query.helper";
import { paginateQuery, PaginationDTO } from "../../helpers/pagination.helper";
import { IRole } from "../../interfaces/models/role.interface";

export const getRolesService = async (
  page: number,
  keyword?: string
): Promise<{
  code: string;
  roles: IRole[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.roles;

  const filter: FilterQuery<IRole> = { deleted: false };
  const regexFilter = buildRegexFilter(["name"], keyword);
  if (regexFilter.$or) {
    filter.$or = regexFilter.$or as FilterQuery<IRole>["$or"];
  }

  const { items, pagination } = await paginateQuery(Role, filter, {
    page,
    pageSize,
    projection: "name description permissions createdAt",
  });

  return { code: "success", roles: items, pagination };
};

export const createRoleService = async (
  admin: { _id: Types.ObjectId; email: string },
  data: { name?: string; description?: string; permissions?: string[] }
): Promise<{ status: number; code: string; message: string; role?: unknown }> => {
  const { name, description, permissions } = data;
  if (!name || typeof name !== "string") {
    return { status: 400, code: "error", message: "Role name is required." };
  }

  const validPerms = (permissions || []).filter((p): p is string => (ALL_PERMISSIONS as readonly string[]).includes(p));
  const role = new Role({ name: name.trim(), description, permissions: validPerms });
  await role.save();

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.ROLE_CREATE,
    targetId: role._id.toString(),
    targetType: "Role",
    detail: { name, permissions: validPerms },
  });

  return { status: 200, code: "success", message: "Role created.", role };
};

export const updateRoleService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string,
  data: { name?: string; description?: string; permissions?: string[] }
): Promise<{ status: number; code: string; message: string }> => {
  const { name, description, permissions } = data;
  const update: Partial<IRole> = {};
  if (name) update.name = name.trim();
  if (description !== undefined) update.description = description;
  if (permissions) update.permissions = permissions.filter(p => (ALL_PERMISSIONS as readonly string[]).includes(p));

  const result = await Role.updateOne({ _id: id, deleted: false }, update);
  if (result.matchedCount === 0) {
    return { status: 404, code: "error", message: "Role not found." };
  }

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.ROLE_UPDATE,
    targetId: id,
    targetType: "Role",
    detail: update,
  });

  return { status: 200, code: "success", message: "Role updated." };
};

export const removeRoleService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string
): Promise<{ status: number; code: string; message: string }> => {
  const role = await Role.findOneAndUpdate({ _id: id, deleted: false }, { deleted: true }).select("name").lean<IRole>();
  if (!role) {
    return { status: 404, code: "error", message: "Role not found." };
  }

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.ROLE_DELETE,
    targetId: id,
    targetType: "Role",
    detail: { name: role.name },
  });

  return { status: 200, code: "success", message: "Role deleted." };
};
