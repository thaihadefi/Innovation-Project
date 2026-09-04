import { Types, Document } from "mongoose";
import { IHelpfulVotes } from "../../helpers/mongoose-plugins/helpful-votes.plugin";
import { ISoftDelete } from "../../helpers/mongoose-plugins/soft-delete.plugin";
import { IIsEdited } from "../../helpers/mongoose-plugins/is-edited.plugin";

export interface IInterviewExperience extends Document, IHelpfulVotes, ISoftDelete, IIsEdited {
  _id: Types.ObjectId;
  title: string;
  content: string;
  companyName: string;
  position: string;
  result: "passed" | "failed" | "pending";
  difficulty: "easy" | "medium" | "hard";
  authorId: Types.ObjectId;
  authorName: string;
  isAnonymous: boolean;
  commentCount: number;
  status: "pending" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
