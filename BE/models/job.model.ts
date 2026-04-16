import mongoose from "mongoose";
import { softDeletePlugin } from "../helpers/mongoose-plugins/soft-delete.plugin";

const schema = new mongoose.Schema(
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
    skills: { type: [String], default: [] },                                                 // Normalized skill keys
    locations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Location" }],                  // Location ObjectIds
    description: String,
    images: { type: [String], default: [] },
    // Application limits
    maxApplications: { type: Number, default: 0 },  // 0 = unlimited
    maxApproved: { type: Number, default: 0 },       // 0 = unlimited
    applicationCount: { type: Number, default: 0 },   // Current number of applications
    approvedCount: { type: Number, default: 0 },      // Current number of approved
    viewCount: { type: Number, default: 0 },          // Number of job detail views
    expirationDate: { type: Date, default: null },     // Optional: job expires after this date
    // deleted injected by softDeletePlugin below
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

schema.plugin(softDeletePlugin);

// Indexes for search optimization
const jobPartial = { partialFilterExpression: { deleted: false } };
schema.index({ companyId: 1, createdAt: -1 }, jobPartial); // Company's jobs listing
schema.index({ position: 1 }, jobPartial); // Filter by position
schema.index({ workingForm: 1 }, jobPartial); // Filter by working form
schema.index({ salaryMin: 1, salaryMax: 1 }, jobPartial); // Salary range filter
// Main discovery/search patterns (active jobs + newest first)
schema.index({ expirationDate: 1, createdAt: -1 }, jobPartial);
schema.index({ skills: 1, createdAt: -1 }, jobPartial); // Skill filter + newest sort
schema.index({ locations: 1, createdAt: -1 }, jobPartial); // Location filter + newest sort

const Job = mongoose.model('Job', schema, "jobs");

export default Job;
