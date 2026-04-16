import mongoose, { Types } from "mongoose";
import { helpfulVotesPlugin, IHelpfulVotes } from "../helpers/mongoose-plugins/helpful-votes.plugin";
import { softDeletePlugin, ISoftDelete } from "../helpers/mongoose-plugins/soft-delete.plugin";
import { isEditedPlugin, IIsEdited } from "../helpers/mongoose-plugins/is-edited.plugin";

interface IExperienceComment extends IHelpfulVotes, ISoftDelete, IIsEdited {
  experienceId: Types.ObjectId;
  authorId: Types.ObjectId;
  authorName: string;
  isAnonymous: boolean;
  content: string;
  parentId?: Types.ObjectId | null;
  replyToId?: Types.ObjectId | null;
  replyToName?: string | null;
}

const schema = new mongoose.Schema<IExperienceComment>(
  {
    experienceId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewExperience", required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate", required: true },
    authorName: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    content: { type: String, required: true, maxlength: 2000 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "ExperienceComment", default: null },
    // When replying to a nested comment, store the actual comment being replied to
    replyToId: { type: mongoose.Schema.Types.ObjectId, ref: "ExperienceComment", default: null },
    replyToName: { type: String, default: null },
    // helpfulVotes, helpfulCount, deleted, isEdited injected by plugins below
  },
  { timestamps: true }
);

schema.plugin(helpfulVotesPlugin);
schema.plugin(softDeletePlugin);
schema.plugin(isEditedPlugin);

schema.index({ experienceId: 1, parentId: 1, createdAt: -1 }, { partialFilterExpression: { deleted: false } });
schema.index({ authorId: 1 }, { partialFilterExpression: { deleted: false } });

const ExperienceComment = mongoose.model<IExperienceComment>("ExperienceComment", schema, "experience_comments");
export default ExperienceComment;
