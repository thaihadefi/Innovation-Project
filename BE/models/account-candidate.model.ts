import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    avatar: String,
    phone: String,
    password: {
      type: String,
      select: false
    },
    studentId: String,
    cohort: Number, // Admission year (e.g., 2006+)
    major: String, // Major/Program name
    skills: { type: [String], default: [] }, // Skills for job recommendations
    isVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    }
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Indexes for query optimization
schema.index({ email: 1 }, { unique: true }); // Email lookup (login, forgot password)
schema.index({ studentId: 1 }); // Student verification lookup
schema.index({ status: 1, createdAt: -1 }); // Admin listing with status filter

const AccountCandidate = mongoose.model('AccountCandidate', schema, "accounts-candidate");

export default AccountCandidate;
