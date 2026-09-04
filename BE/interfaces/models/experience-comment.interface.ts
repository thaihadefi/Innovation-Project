import { Types, Document } from "mongoose";
import { IHelpfulVotes } from "../../helpers/mongoose-plugins/helpful-votes.plugin";
import { ISoftDelete } from "../../helpers/mongoose-plugins/soft-delete.plugin";
import { IIsEdited } from "../../helpers/mongoose-plugins/is-edited.plugin";

export interface IExperienceComment extends Document, IHelpfulVotes, ISoftDelete, IIsEdited {
  _id: Types.ObjectId;
  experienceId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  isAnonymous: boolean;
  content: string;
  parentId?: Types.ObjectId | null;
  replyToId?: Types.ObjectId | null;
  replyToName?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
