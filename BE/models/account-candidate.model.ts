import mongoose from "mongoose";
import { softDeletePlugin } from "../helpers/mongoose-plugins/soft-delete.plugin";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";

const schema = new mongoose.Schema<IAccountCandidate>(
  {
    fullName: { type: String, required: true },
    email:    { type: String, required: true },
    avatar: String,
    phone: String,
    password: {
      type: String,
      select: false
    },
    studentId: String,
    cohort: Number,
    major: String,
    skills: { type: [String], default: [] },
    isVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
  },
  {
    timestamps: true,
  }
);

schema.plugin(softDeletePlugin);

schema.index({ email: 1 }, { unique: true });
schema.index({ phone: 1 }, { unique: true, sparse: true });
schema.index({ studentId: 1 }, { unique: true, sparse: true });
schema.index({ status: 1, createdAt: -1 }, { partialFilterExpression: { deleted: false } });
schema.index({ isVerified: 1 }, { partialFilterExpression: { deleted: false } });

const AccountCandidate = mongoose.model<IAccountCandidate>("AccountCandidate", schema, "accounts_candidate");

export default AccountCandidate;
