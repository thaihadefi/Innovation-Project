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
      default: null,
    },
    reporterType: {
      type: String,
      enum: ["candidate", "company", "guest"],
      required: true,
    },
    reporterIp: {
      type: String,
      default: null,
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
// Prevent duplicate reports from same logged-in user on same target
schema.index(
  { targetType: 1, targetId: 1, reporterId: 1 },
  { unique: true, partialFilterExpression: { reporterId: { $type: "objectId" } } }
);
// Prevent duplicate reports from same guest IP on same target
schema.index(
  { targetType: 1, targetId: 1, reporterIp: 1 },
  { unique: true, partialFilterExpression: { reporterIp: { $type: "string" } } }
);

const Report = mongoose.model("Report", schema, "reports");
export default Report;
