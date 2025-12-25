import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    candidateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCandidate",
      required: true
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AccountCompany",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure unique follow and optimize queries
schema.index({ candidateId: 1, companyId: 1 }, { unique: true });

const FollowCompany = mongoose.model('FollowCompany', schema, "follow-companies");

export default FollowCompany;
