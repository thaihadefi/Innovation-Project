import mongoose from "mongoose";
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
    helpfulVotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate" }],
      default: [],
    },
    helpfulCount: { type: Number, default: 0 },
    deleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ experienceId: 1, parentId: 1, createdAt: -1 }, { partialFilterExpression: { deleted: false } });
schema.index({ authorId: 1 }, { partialFilterExpression: { deleted: false } });

const ExperienceComment = mongoose.model<IExperienceComment>("ExperienceComment", schema, "experience_comments");
export default ExperienceComment;
