import mongoose from "mongoose"; 

const schema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Job"
    },
    fullName: String,
    email: String,
    phone: String,
    fileCV: String,
    viewed: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      default: "initial"
    }
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Indexes for query optimization
schema.index({ jobId: 1, status: 1, createdAt: -1 }); // Company CV list with status filter
schema.index({ email: 1 }); // Lookup by candidate email

const CV = mongoose.model('CV', schema, "cvs");

export default CV;