import { Types, Document } from "mongoose";

export interface IFollowCompany extends Document {
  _id: Types.ObjectId;
  candidateId: Types.ObjectId;
  companyId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}
