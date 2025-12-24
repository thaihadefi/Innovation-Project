import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    // Can be either candidate or company (one or the other)
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCandidate"
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCompany"
    },
    type: {
      type: String,
      enum: ["new_job", "application_received", "application_viewed", "application_approved", "application_rejected", "other"],
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

// Indexes for efficient queries
schema.index({ candidateId: 1, read: 1, createdAt: -1 });
schema.index({ companyId: 1, read: 1, createdAt: -1 });

// TTL index - auto-delete notifications after 30 days
schema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const Notification = mongoose.model('Notification', schema, "notifications");

export default Notification;
