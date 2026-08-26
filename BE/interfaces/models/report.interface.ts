import { Types, Document } from "mongoose";

export interface IReport extends Document {
  _id: Types.ObjectId;
  targetType: "review" | "comment";
  targetId: Types.ObjectId;
  reporterId?: Types.ObjectId | null;
  reporterType: "candidate" | "company" | "guest";
  reporterIp?: string | null;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: Date;
  updatedAt: Date;
}
