import { Types, Document } from "mongoose";

export interface IAccountCandidate extends Document {
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
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
