import { FilterQuery, Types } from "mongoose";
import AccountAdmin from "../../models/account-admin.model";
import Role from "../../models/role.model";
import { adminPaginationConfig } from "../../config/variable";
import { AUDIT_ACTIONS } from "../../config/audit-actions";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";
import { hashPassword } from "../../helpers/security.helper";
import { buildRegexFilter } from "../../helpers/query.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { IAccountAdmin } from "../../interfaces/models/account-admin.interface";
import { IRole } from "../../interfaces/models/role.interface";

export const canActorGrantRole = async (actorPermissions: string[] | null, roleId: string): Promise<boolean> => {
  if (actorPermissions === null) return true;
  const role = await Role.findOne({ _id: roleId, deleted: false }).select("permissions").lean<IRole>();
  if (!role) return false;
  return (role.permissions || []).every((p) => actorPermissions.includes(p));
};

export const getAdminAccountsListService = async (
  page: number,
  keyword?: string,
  status?: string,
  roleId?: string
): Promise<{
  code: string;
  accounts: IAccountAdmin[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.accounts;
  const skip = (page - 1) * pageSize;

  const filter: FilterQuery<IAccountAdmin> = { deleted: false };
  if (status && ["initial", "active", "inactive"].includes(status)) filter.status = status as "active" | "inactive" | "initial";
  if (roleId === "none") filter.role = undefined;
  else if (roleId) filter.role = new Types.ObjectId(roleId);

  const regexFilter = buildRegexFilter(["fullName", "email"], keyword);
  if (regexFilter.$or) {
    filter.$or = regexFilter.$or as FilterQuery<IAccountAdmin>["$or"];
  }

  const [total, accounts] = await Promise.all([
    AccountAdmin.countDocuments(filter),
    AccountAdmin.find(filter)
      .select("fullName email phone role status isSuperAdmin createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .populate("role", "name")
      .lean<IAccountAdmin[]>(),
  ]);

  return {
    code: "success",
    accounts,
    pagination: buildPagination(total, page, pageSize),
  };
};

export const createAdminAccountService = async (
  actor: { _id: Types.ObjectId; email: string; permissions?: string[] | null },
  data: { fullName?: string; email?: string; password?: string; phone?: string; roleId?: string }
): Promise<{ status: number; code: string; message: string }> => {
  const { fullName, email, password, phone, roleId } = data;
  if (!email || !password || !fullName) {
    return { status: 400, code: "error", message: "Missing required fields." };
  }

  const existing = await AccountAdmin.findOne({ email, deleted: false }).select("_id").lean();
  if (existing) {
    return { status: 400, code: "error", message: "Email already exists." };
  }

  if (roleId) {
    const roleExists = await Role.findOne({ _id: roleId, deleted: false }).select("_id").lean();
    if (!roleExists) {
      return { status: 404, code: "error", message: "Role not found." };
    }
    if (!(await canActorGrantRole(actor.permissions ?? null, roleId))) {
      return { status: 403, code: "error", message: "You cannot assign a role with permissions you do not hold." };
    }
  }

  const hashedPassword = await hashPassword(password);

  const account = new AccountAdmin({
    fullName,
    email,
    password: hashedPassword,
    phone: phone || "",
    role: roleId ? new Types.ObjectId(roleId) : undefined,
    status: "active",
    isSuperAdmin: false,
  });
  await account.save();

  logAdminAction({
    actorId: actor._id.toString(),
    actorEmail: actor.email,
    action: AUDIT_ACTIONS.ACCOUNT_CREATE,
    targetId: account._id.toString(),
    targetType: "AccountAdmin",
    detail: { email, fullName, roleId: roleId || null },
  });

  return { status: 200, code: "success", message: "Admin account created." };
};

export const updateAdminAccountService = async (
  actor: { _id: Types.ObjectId; email: string; permissions?: string[] | null },
  id: string,
  data: { fullName?: string; email?: string; phone?: string; roleId?: string; status?: string; password?: string }
): Promise<{ status: number; code: string; message: string }> => {
  const { fullName, email, phone, roleId, status, password } = data;

  const target = await AccountAdmin.findOne({ _id: id, deleted: false }).select("isSuperAdmin").lean<IAccountAdmin>();
  if (!target) {
    return { status: 404, code: "error", message: "Admin account not found." };
  }
  if (target.isSuperAdmin && actor._id.toString() !== id) {
    return { status: 403, code: "error", message: "Cannot modify a superadmin account." };
  }

  if (actor._id.toString() === id && status && status !== "active") {
    return { status: 400, code: "error", message: "Cannot deactivate your own account." };
  }

  if (email) {
    const duplicate = await AccountAdmin.findOne({ email, _id: { $ne: id }, deleted: false }).select("_id").lean();
    if (duplicate) {
      return { status: 400, code: "error", message: "Email already in use." };
    }
  }

  if (roleId) {
    const roleExists = await Role.findOne({ _id: roleId, deleted: false }).select("_id").lean();
    if (!roleExists) {
      return { status: 404, code: "error", message: "Role not found." };
    }
    if (!(await canActorGrantRole(actor.permissions ?? null, roleId))) {
      return { status: 403, code: "error", message: "You cannot assign a role with permissions you do not hold." };
    }
  }

  const updates: Partial<IAccountAdmin> = {};
  if (fullName) updates.fullName = fullName;
  if (email) updates.email = email;
  if (phone !== undefined) updates.phone = phone;
  if (roleId !== undefined) updates.role = roleId ? new Types.ObjectId(roleId) : undefined;
  if (status && ["initial", "active", "inactive"].includes(status)) updates.status = status as "active" | "inactive" | "initial";
  if (password) {
    updates.password = await hashPassword(password);
  }

  const result = await AccountAdmin.updateOne({ _id: id, deleted: false }, updates);
  if (result.matchedCount === 0) {
    return { status: 404, code: "error", message: "Admin account not found." };
  }

  const { password: _pw, ...safeUpdates } = updates;
  logAdminAction({
    actorId: actor._id.toString(),
    actorEmail: actor.email,
    action: AUDIT_ACTIONS.ACCOUNT_UPDATE,
    targetId: id,
    targetType: "AccountAdmin",
    detail: safeUpdates,
  });

  return { status: 200, code: "success", message: "Admin account updated." };
};

export const setAdminAccountStatusService = async (
  actor: { _id: Types.ObjectId },
  id: string,
  status: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!["active", "inactive", "initial"].includes(status)) {
    return { status: 400, code: "error", message: "Invalid status." };
  }
  if (actor._id.toString() === id && status !== "active") {
    return { status: 400, code: "error", message: "Cannot deactivate your own account." };
  }
  const target = await AccountAdmin.findOne({ _id: id, deleted: false }).select("isSuperAdmin").lean<IAccountAdmin>();
  if (target?.isSuperAdmin && actor._id.toString() !== id) {
    return { status: 403, code: "error", message: "Cannot modify a superadmin account." };
  }
  const result = await AccountAdmin.updateOne({ _id: id, deleted: false }, { status });
  if (result.matchedCount === 0) {
    return { status: 404, code: "error", message: "Admin account not found." };
  }
  return { status: 200, code: "success", message: "Status updated." };
};

export const removeAdminAccountService = async (
  actor: { _id: Types.ObjectId; email: string },
  id: string
): Promise<{ status: number; code: string; message: string }> => {
  if (actor._id.toString() === id) {
    return { status: 400, code: "error", message: "Cannot delete your own account." };
  }
  const target = await AccountAdmin.findOne({ _id: id, deleted: false }).select("isSuperAdmin email").lean<IAccountAdmin>();
  if (target?.isSuperAdmin) {
    return { status: 403, code: "error", message: "Cannot delete a superadmin account." };
  }
  const result = await AccountAdmin.updateOne({ _id: id, deleted: false }, { deleted: true });
  if (result.matchedCount === 0) {
    return { status: 404, code: "error", message: "Admin account not found." };
  }

  logAdminAction({
    actorId: actor._id.toString(),
    actorEmail: actor.email,
    action: AUDIT_ACTIONS.ACCOUNT_DELETE,
    targetId: id,
    targetType: "AccountAdmin",
    detail: { email: target?.email },
  });

  return { status: 200, code: "success", message: "Account deleted." };
};

export const setAdminAccountRoleService = async (
  actor: { _id: Types.ObjectId; email: string; permissions?: string[] | null },
  id: string,
  roleId?: string
): Promise<{ status: number; code: string; message: string }> => {
  const target = await AccountAdmin.findOne({ _id: id, deleted: false }).select("isSuperAdmin role").lean<IAccountAdmin>();
  if (target?.isSuperAdmin) {
    return { status: 403, code: "error", message: "Cannot change the role of a superadmin account." };
  }
  if (roleId) {
    const roleExists = await Role.findOne({ _id: roleId, deleted: false }).select("_id").lean();
    if (!roleExists) {
      return { status: 404, code: "error", message: "Role not found." };
    }
    if (!(await canActorGrantRole(actor.permissions ?? null, roleId))) {
      return { status: 403, code: "error", message: "You cannot assign a role with permissions you do not hold." };
    }
  }
  const result = await AccountAdmin.updateOne({ _id: id, deleted: false }, { role: roleId ? new Types.ObjectId(roleId) : undefined });
  if (result.matchedCount === 0) {
    return { status: 404, code: "error", message: "Admin account not found." };
  }

  logAdminAction({
    actorId: actor._id.toString(),
    actorEmail: actor.email,
    action: AUDIT_ACTIONS.ACCOUNT_ROLE_ASSIGN,
    targetId: id,
    targetType: "AccountAdmin",
    detail: { previousRoleId: target?.role?.toString() ?? null, newRoleId: roleId || null },
  });

  return { status: 200, code: "success", message: "Role assigned." };
};
