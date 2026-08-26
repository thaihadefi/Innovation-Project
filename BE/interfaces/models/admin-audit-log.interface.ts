import { Types, Document } from "mongoose";

export interface IAdminAuditLog extends Document {
  _id: Types.ObjectId;
  actorId: Types.ObjectId;
  actorEmail: string;
  action: string;
  targetId?: Types.ObjectId | null;
  targetType?: string | null;
  detail?: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
