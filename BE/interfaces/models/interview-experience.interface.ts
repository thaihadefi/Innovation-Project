import { Types, Document } from "mongoose";

export interface IInterviewExperience extends Document {
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
  helpfulVotes: Types.ObjectId[];
  helpfulCount: number;
  deleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
