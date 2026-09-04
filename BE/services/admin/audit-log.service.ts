import AdminAuditLog from "../../models/admin-audit-log.model";
import { adminPaginationConfig } from "../../config/variable";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { escapeRegex } from "../../helpers/query.helper";
import { IAdminAuditLog } from "../../interfaces/models/admin-audit-log.interface";

export const getAuditLogsService = async (
  page: number,
  actorEmail?: string,
  action?: string
): Promise<{
  code: string;
  logs: IAdminAuditLog[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.auditLogs;
  const skip = (page - 1) * pageSize;

  const filter: Record<string, unknown> = {};
  if (actorEmail && actorEmail.trim()) {
    filter.actorEmail = { $regex: escapeRegex(actorEmail.trim()), $options: "i" };
  }
  if (action && action.trim()) {
    filter.action = { $regex: escapeRegex(action.trim()), $options: "i" };
  }

  const [total, logs] = await Promise.all([
    AdminAuditLog.countDocuments(filter),
    AdminAuditLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<IAdminAuditLog[]>(),
  ]);

  return {
    code: "success",
    logs,
    pagination: buildPagination(total, page, pageSize),
  };
};
