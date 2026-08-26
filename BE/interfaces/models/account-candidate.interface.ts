import { Types, Document } from "mongoose";
import { ISoftDelete } from "../../helpers/mongoose-plugins/soft-delete.plugin";

export interface IAccountCandidate extends Document, ISoftDelete {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  avatar?: string;
  phone?: string;
  password?: string;
  studentId?: string;
  cohort?: number;
  major?: string;
  skills: string[];
  isVerified: boolean;
  status: "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
