import { Types, Document } from "mongoose";

export interface IExperienceComment extends Document {
  _id: Types.ObjectId;
  experienceId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  isAnonymous: boolean;
  content: string;
  parentId?: Types.ObjectId | null;
  replyToId?: Types.ObjectId | null;
  replyToName?: string | null;
  helpfulVotes: Types.ObjectId[];
  helpfulCount: number;
  deleted: boolean;
  isEdited: boolean;
  createdAt: Date;
  updatedAt: Date;
}
