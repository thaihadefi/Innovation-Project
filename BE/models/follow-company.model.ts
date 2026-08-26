import mongoose from "mongoose";
import { IFollowCompany } from "../interfaces/models/follow-company.interface";

const schema = new mongoose.Schema<IFollowCompany>(
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

schema.index({ candidateId: 1, companyId: 1 }, { unique: true });
schema.index({ companyId: 1 });

const FollowCompany = mongoose.model<IFollowCompany>('FollowCompany', schema, "follow_companies");

export default FollowCompany;
