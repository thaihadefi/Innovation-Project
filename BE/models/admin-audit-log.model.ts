import mongoose from "mongoose";

/**
 * Immutable audit log for sensitive admin actions.
 * Records are never updated or deleted — TTL index handles retention.
 */
const schema = new mongoose.Schema(
  {
    actorId:    { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
    actorEmail: { type: String, required: true },
    action:     { type: String, required: true }, // e.g. "account.create", "role.assign"
    targetId:   { type: mongoose.Schema.Types.ObjectId, default: null },
    targetType: { type: String, default: null },  // e.g. "AccountAdmin", "Role"
    detail:     { type: mongoose.Schema.Types.Mixed, default: null }, // sanitized snapshot
  },
  {
    timestamps: true,
    // TTL handled by schema.index({ createdAt: 1 }, { expireAfterSeconds: ... }) below
  }
);

schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });
schema.index({ actorId: 1, createdAt: -1 });

const AdminAuditLog = mongoose.model("AdminAuditLog", schema, "admin_audit_logs");
export default AdminAuditLog;
