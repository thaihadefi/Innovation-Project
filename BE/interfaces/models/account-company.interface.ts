import { Types, Document } from "mongoose";
import { ISoftDelete } from "../../helpers/mongoose-plugins/soft-delete.plugin";

export interface IAccountCompany extends Document, ISoftDelete {
  _id: Types.ObjectId;
  companyName: string;
  slug?: string;
  email: string;
  password?: string;
  location?: string;
  address?: string;
  companyModel?: string;
  companyEmployees?: string;
  workingTime?: string;
  workOverTime?: string;
  phone?: string;
  description?: string;
  logo?: string;
  status: "initial" | "active" | "inactive";
  createdAt: Date;
  updatedAt: Date;
}
