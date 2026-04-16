import mongoose from "mongoose";
import { softDeletePlugin } from "../helpers/mongoose-plugins/soft-delete.plugin";

const schema = new mongoose.Schema(
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
    cohort: Number, // Admission year (e.g., 2006+)
    major: String, // Major/Program name
    skills: { type: [String], default: [] }, // Normalized skill keys for job recommendations
    isVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    // deleted injected by softDeletePlugin below
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

schema.plugin(softDeletePlugin);

// Indexes for query optimization
schema.index({ email: 1 }, { unique: true }); // Email lookup (login, forgot password)
schema.index({ phone: 1 }, { unique: true, sparse: true }); // Phone must be unique; sparse allows null/missing
schema.index({ studentId: 1 }, { unique: true, sparse: true }); // StudentId must be unique; sparse allows null/missing
schema.index({ status: 1, createdAt: -1 }, { partialFilterExpression: { deleted: false } }); // Admin listing with status filter
schema.index({ isVerified: 1 }, { partialFilterExpression: { deleted: false } }); // Admin filter by verification status

const AccountCandidate = mongoose.model("AccountCandidate", schema, "accounts_candidate");

export default AccountCandidate;
