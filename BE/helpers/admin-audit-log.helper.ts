import AdminAuditLog from "../models/admin-audit-log.model";

interface AuditParams {
  actorId: string;
  actorEmail: string;
  action: string;
  targetId?: string | null;
  targetType?: string | null;
  detail?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget audit log write. Never throws — a logging failure
 * must not interrupt the request that triggered it.
 */
export const logAdminAction = (params: AuditParams): void => {
  AdminAuditLog.create(params).catch((err) =>
    console.error("[AuditLog] Failed to write entry:", err)
  );
};
