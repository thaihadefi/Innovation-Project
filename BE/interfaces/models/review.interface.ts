import { Types, Document } from "mongoose";
import { IHelpfulVotes } from "../../helpers/mongoose-plugins/helpful-votes.plugin";
import { ISoftDelete } from "../../helpers/mongoose-plugins/soft-delete.plugin";
import { IIsEdited } from "../../helpers/mongoose-plugins/is-edited.plugin";

export interface IReviewRatings {
  salary?: number | null;
  workLifeBalance?: number | null;
  career?: number | null;
  culture?: number | null;
  management?: number | null;
}

export interface IReview extends Document, IHelpfulVotes, ISoftDelete, IIsEdited {
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
  createdAt: Date;
  updatedAt: Date;
}
