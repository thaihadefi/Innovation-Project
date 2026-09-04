import mongoose from "mongoose";
import { IReport } from "../interfaces/models/report.interface";

const schema = new mongoose.Schema<IReport>(
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

schema.index({ status: 1, createdAt: -1 });
schema.index({ targetType: 1, targetId: 1 });
schema.index({ targetType: 1, targetId: 1, reporterId: 1 }, { unique: true, sparse: true });
schema.index({ targetType: 1, targetId: 1, reporterIp: 1 });

const Report = mongoose.model<IReport>("Report", schema, "reports");
export default Report;
