import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { serverError } from "../../helpers/response.helper";
import * as auditLogService from "../../services/admin/audit-log.service";

export const list = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page);
    const actorEmail = String(req.query.actorEmail || "").trim();
    const action = String(req.query.action || "").trim();

    const data = await auditLogService.getAuditLogsService(
      page,
      actorEmail || undefined,
      action || undefined
    );
    res.json(data);
  } catch {
    serverError(res);
  }
};
