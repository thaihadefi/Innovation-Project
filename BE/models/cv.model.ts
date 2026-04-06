import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    jobId:       { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate" }, // backfilled via migration
    fullName:    { type: String, required: true },
    email:       { type: String, required: true },
    phone:       { type: String, default: "" },
    fileCV:      { type: String, required: true },
    // State machine: initial → viewed → approved/rejected
    status:      { type: String, enum: ["initial", "viewed", "approved", "rejected"], default: "initial" },
  },
  { timestamps: true }
);

schema.index({ jobId: 1, status: 1, createdAt: -1 }); // Company CV list with status filter
schema.index({ email: 1 });                            // Lookup by candidate email
schema.index({ jobId: 1, email: 1 }, { unique: true }); // One CV per job per email

const CV = mongoose.model("CV", schema, "cvs");
export default CV;
