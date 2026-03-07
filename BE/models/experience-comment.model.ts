import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    experienceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewExperience",
      required: true,
    },
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCandidate",
      required: true,
    },
    authorName: { type: String, required: true },
    isAnonymous: { type: Boolean, default: false },
    content: { type: String, required: true, maxlength: 2000 },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExperienceComment",
      default: null,
    },
    // When replying to a nested comment, store the actual comment being replied to
    replyToId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ExperienceComment",
      default: null,
    },
    replyToName: { type: String, default: null },
    helpfulVotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "AccountCandidate",
      },
    ],
    helpfulCount: { type: Number, default: 0 },
    deleted: { type: Boolean, default: false },
    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ experienceId: 1, parentId: 1, createdAt: -1 });
schema.index({ authorId: 1 });

const ExperienceComment = mongoose.model("ExperienceComment", schema, "experience_comments");
export default ExperienceComment;
