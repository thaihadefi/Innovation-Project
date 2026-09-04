import { Types, Document } from "mongoose";

export interface INotificationData {
  jobId?: Types.ObjectId;
  jobTitle?: string;
  jobSlug?: string;
  cvId?: Types.ObjectId;
  applicantName?: string;
  companyName?: string;
}

export type NotificationType =
  | "new_job"
  | "application_received"
  | "application_viewed"
  | "application_approved"
  | "application_rejected"
  | "applications_limit_reached"
  | "experience_approved"
  | "experience_rejected"
  | "candidate_applied"
  | "cv_approved"
  | "cv_rejected"
  | "experience_comment"
  | "other";

export interface INotification extends Document {
  _id: Types.ObjectId;
  candidateId?: Types.ObjectId;
  companyId?: Types.ObjectId;
  adminId?: Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  data?: INotificationData;
  createdAt: Date;
  updatedAt: Date;
}
