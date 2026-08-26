import { Types, Document } from "mongoose";

export interface IEmailChangeRequest extends Document {
  _id: Types.ObjectId;
  accountId: Types.ObjectId;
  accountType: "candidate" | "company";
  newEmail: string;
  otp: string;
  expireAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
