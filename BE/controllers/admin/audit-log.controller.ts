import { Response } from "express";
import AdminAuditLog from "../../models/admin-audit-log.model";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";

/** GET /admin/audit-logs — paginated list with optional filters */
export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page     = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.auditLogs;
    const skip     = (page - 1) * pageSize;

    const actorEmail = String(req.query.actorEmail || "").trim();
    const action     = String(req.query.action     || "").trim();

    const filter: Record<string, unknown> = {};
    if (actorEmail) filter.actorEmail = { $regex: actorEmail, $options: "i" };
    if (action)     filter.action     = { $regex: action,     $options: "i" };

    const [total, logs] = await Promise.all([
      AdminAuditLog.countDocuments(filter),
      AdminAuditLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      code: "success",
      logs,
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
