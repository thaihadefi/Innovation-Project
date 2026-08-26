import mongoose from "mongoose";
import { ISavedJob } from "../interfaces/models/saved-job.interface";

const schema = new mongoose.Schema<ISavedJob>(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCandidate",
      required: true
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job",
      required: true
    }
  },
  {
    timestamps: true
  }
);

schema.index({ candidateId: 1, jobId: 1 }, { unique: true });
schema.index({ candidateId: 1, createdAt: -1 });

const SavedJob = mongoose.model<ISavedJob>('SavedJob', schema, "saved_jobs");

export default SavedJob;
