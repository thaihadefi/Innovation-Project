import mongoose from "mongoose";
import { IJob } from "../interfaces/models/job.interface";

const schema = new mongoose.Schema<IJob>(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCompany"
    },
    title: String,
    slug: {
      type: String,
      unique: true
    },
    salaryMin: Number,
    salaryMax: Number,
    position: String,
    workingForm: String,
    skills: { type: [String], default: [] },
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],
    description: String,
    images: { type: [String], default: [] },
    maxApplications: { type: Number, default: 0 },
    maxApproved: { type: Number, default: 0 },
    applicationCount: { type: Number, default: 0 },
    approvedCount: { type: Number, default: 0 },
    viewCount: { type: Number, default: 0 },
    expirationDate: { type: Date, default: null },
    deleted: { type: Boolean, default: false },
  },
  {
    timestamps: true,
  }
);

const jobPartial = { partialFilterExpression: { deleted: false } };
schema.index({ companyId: 1, createdAt: -1 }, jobPartial);
schema.index({ position: 1 }, jobPartial);
schema.index({ workingForm: 1 }, jobPartial);
schema.index({ salaryMin: 1, salaryMax: 1 }, jobPartial);
schema.index({ expirationDate: 1, createdAt: -1 }, jobPartial);
schema.index({ skills: 1, createdAt: -1 }, jobPartial);
schema.index({ locations: 1, createdAt: -1 }, jobPartial);

const Job = mongoose.model<IJob>('Job', schema, "jobs");

export default Job;
