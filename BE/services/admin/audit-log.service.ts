import { FilterQuery } from "mongoose";
import AdminAuditLog from "../../models/admin-audit-log.model";
import { adminPaginationConfig } from "../../config/variable";
import { paginateQuery, PaginationDTO } from "../../helpers/pagination.helper";
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

  const filter: FilterQuery<IAdminAuditLog> = {};
  if (actorEmail && actorEmail.trim()) {
    filter.actorEmail = { $regex: escapeRegex(actorEmail.trim()), $options: "i" };
  }
  if (action && action.trim()) {
    filter.action = { $regex: escapeRegex(action.trim()), $options: "i" };
  }

  const { items, pagination } = await paginateQuery(AdminAuditLog, filter, { page, pageSize });

  return { code: "success", logs: items, pagination };
};
