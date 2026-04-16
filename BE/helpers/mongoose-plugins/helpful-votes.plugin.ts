import mongoose, { Schema, Types } from "mongoose";

export interface IHelpfulVotes {
  helpfulVotes: Types.ObjectId[];
  helpfulCount: number;
}

/**
 * Reusable Mongoose plugin for helpful vote tracking.
 * Applied to: Review, InterviewExperience, ExperienceComment
 *
 * Adds:
 *   - helpfulVotes: array of candidate ObjectIds who voted
 *   - helpfulCount: denormalized count for fast sorting/display (kept in sync manually)
 */
export const helpfulVotesPlugin = (schema: Schema): void => {
  schema.add({
    helpfulVotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate" }],
      default: [],
    },
    helpfulCount: { type: Number, default: 0 },
  });
};
