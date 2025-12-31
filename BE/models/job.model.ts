import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    companyId: String,
    title: String,
    slug: {
      type: String,
      unique: true
    },
    salaryMin: Number,
    salaryMax: Number,
    position: String,
    workingForm: String,
    technologies: Array,
    technologySlugs: Array, // Array of slugified technology names for fast querying
    cities: Array, // Array of city IDs
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
schema.index({ technologySlugs: 1 }); // Search by technology
schema.index({ cities: 1 }); // Search by city
schema.index({ position: 1 }); // Filter by position
schema.index({ workingForm: 1 }); // Filter by working form
schema.index({ salaryMin: 1, salaryMax: 1 }); // Salary range filter
schema.index({ createdAt: -1 }); // Sort by newest

const Job = mongoose.model('Job', schema, "jobs");

export default Job;