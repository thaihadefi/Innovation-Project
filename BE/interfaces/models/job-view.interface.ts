import { Types, Document } from "mongoose";

export interface IJobView extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  viewerId?: Types.ObjectId | null;
  fingerprint?: string | null;
  viewDate: string;
  createdAt: Date;
  updatedAt: Date;
}
