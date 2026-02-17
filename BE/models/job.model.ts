import mongoose from "mongoose";

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
    skills: Array,
    skillSlugs: Array, // Array of slugified skill names for fast querying
    locations: Array, // Array of location IDs
    description: String,
    images: Array,
    // Application limits
    maxApplications: { type: Number, default: 0 },  // 0 = unlimited
    maxApproved: { type: Number, default: 0 },       // 0 = unlimited
    applicationCount: { type: Number, default: 0 },   // Current number of applications
    approvedCount: { type: Number, default: 0 },      // Current number of approved
    viewCount: { type: Number, default: 0 },          // Number of job detail views
    expirationDate: { type: Date, default: null }     // Optional: job expires after this date
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Indexes for search optimization
schema.index({ companyId: 1, createdAt: -1 }); // Company's jobs listing
schema.index({ position: 1 }); // Filter by position
schema.index({ workingForm: 1 }); // Filter by working form
schema.index({ salaryMin: 1, salaryMax: 1 }); // Salary range filter
// Main discovery/search patterns (active jobs + newest first)
schema.index({ expirationDate: 1, createdAt: -1 });
schema.index({ skillSlugs: 1, createdAt: -1 }); // Skill filter + newest sort
schema.index({ locations: 1, createdAt: -1 }); // Location filter + newest sort

const Job = mongoose.model('Job', schema, "jobs");

export default Job;
