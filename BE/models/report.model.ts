import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    targetType: {
      type: String,
      enum: ["review", "comment"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    reporterType: {
      type: String,
      enum: ["candidate", "company"],
      required: true,
    },
    reason: {
      type: String,
      required: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
  },
  { timestamps: true }
);

schema.index({ targetType: 1, targetId: 1 });
schema.index({ reporterId: 1, reporterType: 1 });
schema.index({ status: 1, createdAt: -1 });
// Prevent duplicate reports from same user on same target
schema.index({ targetType: 1, targetId: 1, reporterId: 1 }, { unique: true });

const Report = mongoose.model("Report", schema, "reports");
export default Report;
