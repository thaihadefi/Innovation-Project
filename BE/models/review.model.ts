import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCompany",
      required: true
    },
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCandidate",
      required: true
    },
    isAnonymous: {
      type: Boolean,
      default: true
    },
    // Overall rating (1-5)
    overallRating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    // Category ratings
    ratings: {
      salary: { type: Number, min: 1, max: 5 },
      workLifeBalance: { type: Number, min: 1, max: 5 },
      career: { type: Number, min: 1, max: 5 },
      culture: { type: Number, min: 1, max: 5 },
      management: { type: Number, min: 1, max: 5 }
    },
    // Review content
    title: {
      type: String,
      required: true,
      maxlength: 100
    },
    content: {
      type: String,
      required: true
    },
    pros: String,
    cons: String,
    // Review status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "approved" // Auto-approve for now, can add moderation later
    },
    // Engagement
    helpfulVotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCandidate"
    }],
    helpfulCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Indexes
reviewSchema.index({ companyId: 1, createdAt: -1 }); // Company reviews list
reviewSchema.index({ candidateId: 1 }); // Candidate's reviews
reviewSchema.index({ companyId: 1, candidateId: 1 }, { unique: true }); // One review per company per candidate

const Review = mongoose.model("Review", reviewSchema, "reviews");

export default Review;
