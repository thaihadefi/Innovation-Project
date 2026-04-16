import mongoose, { Types } from "mongoose";
import { helpfulVotesPlugin, IHelpfulVotes } from "../helpers/mongoose-plugins/helpful-votes.plugin";
import { softDeletePlugin, ISoftDelete } from "../helpers/mongoose-plugins/soft-delete.plugin";
import { isEditedPlugin, IIsEdited } from "../helpers/mongoose-plugins/is-edited.plugin";

interface IReview extends IHelpfulVotes, ISoftDelete, IIsEdited {
  companyId: Types.ObjectId;
  candidateId: Types.ObjectId;
  isAnonymous: boolean;
  overallRating: number;
  ratings?: {
    salary?: number | null;
    workLifeBalance?: number | null;
    career?: number | null;
    culture?: number | null;
    management?: number | null;
  };
  title: string;
  content: string;
  pros?: string;
  cons?: string;
  status: "pending" | "approved" | "rejected";
}

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
    // helpfulVotes, helpfulCount, deleted, isEdited injected by plugins below
  },
  { timestamps: true }
);

reviewSchema.plugin(helpfulVotesPlugin);
reviewSchema.plugin(softDeletePlugin);
reviewSchema.plugin(isEditedPlugin);

// Indexes
reviewSchema.index({ companyId: 1, createdAt: -1 }); // Company reviews list
reviewSchema.index({ candidateId: 1 }); // Candidate's reviews
reviewSchema.index({ companyId: 1, candidateId: 1 }, { unique: true }); // One review per company per candidate
reviewSchema.index({ deleted: 1 }); // Soft-delete filter

const Review = mongoose.model<IReview>("Review", reviewSchema, "reviews");

export default Review;
