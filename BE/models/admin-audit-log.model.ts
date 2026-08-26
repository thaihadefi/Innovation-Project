import mongoose from "mongoose";
import { IAdminAuditLog } from "../interfaces/models/admin-audit-log.interface";

const schema = new mongoose.Schema<IAdminAuditLog>(
  {
    actorId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    actorEmail: { type: String, required: true },
    action:     { type: String, required: true },
    targetId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    targetType: { type: String, default: null },
    detail:     { type: mongoose.Schema.Types.Mixed, default: null },
  },
  {
    timestamps: true,
  }
);

schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
schema.index({ actorId: 1, createdAt: -1 });

const AdminAuditLog = mongoose.model<IAdminAuditLog>("AdminAuditLog", schema, "admin_audit_logs");
export default AdminAuditLog;
