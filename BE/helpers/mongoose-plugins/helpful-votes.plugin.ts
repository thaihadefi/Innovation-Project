import mongoose, { Schema, Types } from "mongoose";

export interface IHelpfulVotes {
  helpfulVotes: Types.ObjectId[];
  helpfulCount: number;
}

export const helpfulVotesPlugin = (schema: Schema): void => {
  schema.add({
    helpfulVotes: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "AccountCandidate" }],
      default: [],
    },
    helpfulCount: { type: Number, default: 0 },
  });
};
