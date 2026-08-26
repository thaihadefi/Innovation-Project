import mongoose from "mongoose";
import { INotification } from "../interfaces/models/notification.interface";

const schema = new mongoose.Schema<INotification>(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCandidate"
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCompany"
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountAdmin"
    },
    type: {
      type: String,
      enum: ["new_job", "application_received", "application_viewed", "application_approved", "application_rejected", "applications_limit_reached", "experience_approved", "experience_rejected", "other"],
      default: "other"
    },
    title: String,
    message: String,
    link: String,
    read: {
      type: Boolean,
      default: false
    },
    data: {
      jobId: mongoose.Schema.Types.ObjectId,
      jobTitle: String,
      jobSlug: String,
      cvId: mongoose.Schema.Types.ObjectId,
      applicantName: String,
      companyName: String
    }
  },
  {
    timestamps: true
  }
);

schema.index({ candidateId: 1, createdAt: -1 });
schema.index({ companyId: 1, createdAt: -1 });
schema.index({ adminId: 1, createdAt: -1 });
schema.index({ candidateId: 1, read: 1 });
schema.index({ companyId: 1, read: 1 });
schema.index({ adminId: 1, read: 1 });
schema.index({ createdAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const Notification = mongoose.model<INotification>('Notification', schema, "notifications");

export default Notification;
