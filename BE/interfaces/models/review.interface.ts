import { Types, Document } from "mongoose";

export interface IReviewRatings {
  salary?: number | null;
  workLifeBalance?: number | null;
  career?: number | null;
  culture?: number | null;
  management?: number | null;
}

export interface IReview extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  candidateId: Types.ObjectId;
  isAnonymous: boolean;
  overallRating: number;
  ratings?: IReviewRatings;
  title: string;
  content: string;
  pros?: string;
  cons?: string;
  status: "pending" | "approved" | "rejected";
  helpfulVotes: Types.ObjectId[];
  helpfulCount: number;
  deleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
