import mongoose from "mongoose";

const schema = new mongoose.Schema(
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

// Compound index to ensure unique save and optimize queries
schema.index({ candidateId: 1, jobId: 1 }, { unique: true });
schema.index({ candidateId: 1, createdAt: -1 }); // For listing saved jobs

const SavedJob = mongoose.model('SavedJob', schema, "saved-jobs");

export default SavedJob;
