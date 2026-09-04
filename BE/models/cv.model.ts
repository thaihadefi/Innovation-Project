import mongoose from "mongoose";
import { ICV } from "../interfaces/models/cv.interface";

const schema = new mongoose.Schema<ICV>(
  {
    jobId:       { type: mongoose.Schema.Types.ObjectId, ref: "Job", required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate" },
    fullName:    { type: String, required: true },
    email:       { type: String, required: true },
    phone:       { type: String, default: "" },
    fileCV:      { type: String, required: true },
    status:      { type: String, enum: ["initial", "viewed", "approved", "rejected"], default: "initial" },
  },
  { timestamps: true }
);

schema.index({ jobId: 1, status: 1, createdAt: -1 });
schema.index({ email: 1 });
schema.index({ candidateId: 1, createdAt: -1 });
schema.index({ jobId: 1, email: 1 }, { unique: true });

const CV = mongoose.model<ICV>("CV", schema, "cvs");
export default CV;
