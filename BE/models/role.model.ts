import mongoose from "mongoose";

// Available permissions for RBAC
export const ALL_PERMISSIONS = [
  "candidates_view",
  "candidates_verify",
  "candidates_ban",
  "candidates_delete",
  "companies_view",
  "companies_approve",
  "companies_ban",
  "companies_delete",
  "jobs_view",
  "jobs_delete",
  "roles_view",
  "roles_manage",
  "accounts_view",
  "accounts_manage",
  "experiences_view",
  "experiences_manage",
  "reviews_view",
  "reviews_manage",
  "reports_view",
  "reports_manage",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    permissions: { type: [String], default: [] }, // Array of Permission strings
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ name: 1 });

const Role = mongoose.model("Role", schema, "roles");
export default Role;
