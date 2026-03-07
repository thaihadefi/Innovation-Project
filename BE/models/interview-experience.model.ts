import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxlength: 150 },
    content: { type: String, required: true },
    companyName: { type: String, required: true, maxlength: 100 },
    position: { type: String, required: true, maxlength: 100 },
    // Interview outcome
    result: { type: String, enum: ["passed", "failed", "pending"], default: "pending" },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], required: true },
    // Author info
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate", required: true },
    authorName: { type: String, required: true }, // cached for display
    isAnonymous: { type: Boolean, default: false },
    // Moderation
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ status: 1, createdAt: -1 });
schema.index({ authorId: 1 });

const InterviewExperience = mongoose.model(
  "InterviewExperience",
  schema,
  "interview_experiences"
);
export default InterviewExperience;
