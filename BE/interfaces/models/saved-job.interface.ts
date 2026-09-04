import { Types, Document } from "mongoose";

export interface ISavedJob extends Document {
  _id: Types.ObjectId;
  candidateId: Types.ObjectId;
  jobId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
