import { Types, Document } from "mongoose";

export interface IAccountAdmin extends Document {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role?: Types.ObjectId;
  isSuperAdmin: boolean;
  status: "initial" | "active" | "inactive";
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
