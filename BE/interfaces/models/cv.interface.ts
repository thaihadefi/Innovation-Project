import { Types, Document } from "mongoose";

export interface ICV extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  candidateId?: Types.ObjectId;
  fullName: string;
  email: string;
  phone?: string;
  fileCV: string;
  status: "initial" | "viewed" | "approved" | "rejected";
  createdAt: Date;
  updatedAt: Date;
}
