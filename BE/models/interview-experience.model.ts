import mongoose from "mongoose";
import { helpfulVotesPlugin } from "../helpers/mongoose-plugins/helpful-votes.plugin";
import { softDeletePlugin } from "../helpers/mongoose-plugins/soft-delete.plugin";
import { isEditedPlugin } from "../helpers/mongoose-plugins/is-edited.plugin";
import { IInterviewExperience } from "../interfaces/models/interview-experience.interface";

const schema = new mongoose.Schema<IInterviewExperience>(
  {
    title: { type: String, required: true, maxlength: 150 },
    content: { type: String, required: true },
    companyName: { type: String, required: true, maxlength: 100 },
    position: { type: String, required: true, maxlength: 100 },
    result: { type: String, enum: ["passed", "failed", "pending"], default: "pending" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate", required: true },
    authorName: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    commentCount: { type: Number, default: 0 },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

schema.plugin(helpfulVotesPlugin);
schema.plugin(softDeletePlugin);
schema.plugin(isEditedPlugin);

schema.index({ deleted: 1, status: 1, createdAt: -1 });
schema.index({ authorId: 1 }, { partialFilterExpression: { deleted: false } });

const InterviewExperience = mongoose.model<IInterviewExperience>(
  "InterviewExperience",
  schema,
  "interview_experiences"
);
export default InterviewExperience;
