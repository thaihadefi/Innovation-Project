import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    jobId: { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    viewerId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate", default: null }, // User ID if logged in, null if anonymous
    fingerprint: { type: String, default: null }, // For anonymous users (IP-based or session)
    viewDate: { type: String, required: true } // YYYY-MM-DD format for daily unique
  },
  {
    timestamps: true
  }
);

// Compound index for unique views per user per day
schema.index({ jobId: 1, viewerId: 1, viewDate: 1 }, { unique: true, sparse: true });
schema.index({ jobId: 1, fingerprint: 1, viewDate: 1 });
schema.index({ jobId: 1 }); // For counting views per job
// TTL index to auto-clean old view records (reduce storage)
schema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days

const JobView = mongoose.model('JobView', schema, "job_views");

export default JobView;
