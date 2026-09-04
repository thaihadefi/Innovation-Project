import mongoose from "mongoose";
import { helpfulVotesPlugin } from "../helpers/mongoose-plugins/helpful-votes.plugin";
import { softDeletePlugin } from "../helpers/mongoose-plugins/soft-delete.plugin";
import { isEditedPlugin } from "../helpers/mongoose-plugins/is-edited.plugin";
import { IReview } from "../interfaces/models/review.interface";

const reviewSchema = new mongoose.Schema<IReview>(
  {
    companyId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCompany", required: true },
    candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate", required: true },
    isAnonymous: { type: Boolean, default: true },
    overallRating: { type: Number, required: true, min: 1, max: 5 },
    ratings: {
      salary: { type: Number, min: 1, max: 5 },
      workLifeBalance: { type: Number, min: 1, max: 5 },
      career: { type: Number, min: 1, max: 5 },
      culture: { type: Number, min: 1, max: 5 },
      management: { type: Number, min: 1, max: 5 }
    },
    title: { type: String, required: true, maxlength: 100 },
    content: { type: String, required: true },
    pros: String,
    cons: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "approved" },
  },
  { timestamps: true }
);

reviewSchema.plugin(helpfulVotesPlugin);
reviewSchema.plugin(softDeletePlugin);
reviewSchema.plugin(isEditedPlugin);

reviewSchema.index({ companyId: 1, createdAt: -1 }, { partialFilterExpression: { deleted: false } });
reviewSchema.index({ candidateId: 1 }, { partialFilterExpression: { deleted: false } });
reviewSchema.index({ companyId: 1, candidateId: 1 }, { unique: true });
reviewSchema.index({ deleted: 1 });

const Review = mongoose.model<IReview>("Review", reviewSchema, "reviews");

export default Review;
