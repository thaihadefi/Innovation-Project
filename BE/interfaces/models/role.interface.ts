import { Types, Document } from "mongoose";

export interface IRole extends Document {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  permissions: string[];
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
