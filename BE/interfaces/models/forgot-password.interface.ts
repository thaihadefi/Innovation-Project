import { Types, Document } from "mongoose";

export interface IForgotPassword extends Document {
  _id: Types.ObjectId;
  email: string;
  otp: string;
  accountType: "candidate" | "company" | "admin";
  expireAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
