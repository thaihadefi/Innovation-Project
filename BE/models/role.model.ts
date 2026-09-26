import mongoose from "mongoose";
import { IRole } from "../interfaces/models/role.interface";

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
  "reviews_manage",
  "reports_view",
  "reports_manage",
  "audit_logs_view",
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

const schema = new mongoose.Schema<IRole>(
  {
    name: { type: String, required: true },
    description: String,
    permissions: { type: [String], default: [] },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const Role = mongoose.model<IRole>("Role", schema, "roles");

export default Role;
