import mongoose from "mongoose";
import { IJobView } from "../interfaces/models/job-view.interface";

const schema = new mongoose.Schema<IJobView>(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    },
    viewerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCandidate",
      default: null
    },
    fingerprint: {
      type: String,
      default: null
    },
    viewDate: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true
  }
);

schema.index({ jobId: 1, viewerId: 1, viewDate: 1 }, { unique: true, sparse: true });
schema.index({ jobId: 1, fingerprint: 1, viewDate: 1 });
schema.index({ createdAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const JobView = mongoose.model<IJobView>('JobView', schema, "job_views");

export default JobView;
