import { Types, Document } from "mongoose";

export interface IJob extends Document {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  title: string;
  slug: string;
  salaryMin?: number;
  salaryMax?: number;
  position?: string;
  workingForm?: string;
  skills: string[];
  locations: Types.ObjectId[];
  description?: string;
  images: string[];
  maxApplications: number;
  maxApproved: number;
  applicationCount: number;
  approvedCount: number;
  viewCount: number;
  expirationDate?: Date | null;
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
