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
    approvedCount: { type: Number, default: 0 }       // Current number of approved
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

const Job = mongoose.model('Job', schema, "jobs");

export default Job;