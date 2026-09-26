import { Types, Document } from "mongoose";

export interface IAccountCompany extends Document {
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
  deleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
