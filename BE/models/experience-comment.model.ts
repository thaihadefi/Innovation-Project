import mongoose from "mongoose";
import { helpfulVotesPlugin } from "../helpers/mongoose-plugins/helpful-votes.plugin";
import { softDeletePlugin } from "../helpers/mongoose-plugins/soft-delete.plugin";
import { isEditedPlugin } from "../helpers/mongoose-plugins/is-edited.plugin";
import { IExperienceComment } from "../interfaces/models/experience-comment.interface";

const schema = new mongoose.Schema<IExperienceComment>(
  {
    experienceId: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewExperience", required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate", required: true },
    authorName: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    content: { type: String, required: true, maxlength: 2000 },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "ExperienceComment", default: null },
    replyToId: { type: mongoose.Schema.Types.ObjectId, ref: "ExperienceComment", default: null },
    replyToName: { type: String, default: null },
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
