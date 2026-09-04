import { Types, Document } from "mongoose";
import { ISoftDelete } from "../../helpers/mongoose-plugins/soft-delete.plugin";

export interface IAccountAdmin extends Document, ISoftDelete {
  _id: Types.ObjectId;
  fullName: string;
  email: string;
  password?: string;
  phone?: string;
  avatar?: string;
  role?: Types.ObjectId;
  isSuperAdmin: boolean;
  status: "initial" | "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
