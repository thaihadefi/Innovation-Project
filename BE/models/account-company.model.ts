import mongoose from "mongoose";
import { IAccountCompany } from "../interfaces/models/account-company.interface";

const schema = new mongoose.Schema<IAccountCompany>(
  {
    companyName: { type: String, required: true },
    slug: { type: String, unique: true },
    email: { type: String, required: true },
    password: {
      type: String,
      select: false
    },
    location: String,
    address: String,
    companyModel: String,
    companyEmployees: String,
    workingTime: String,
    workOverTime: String,
    phone: String,
    description: String,
    logo: String,
    status: {
      type: String,
      enum: ["initial", "active", "inactive"],
      default: "initial"
    },
    deleted: {
      type: Boolean,
      default: false
    },
  },
  {
    timestamps: true,
  }
);

schema.index({ email: 1 }, { unique: true });
schema.index({ phone: 1 }, { unique: true, sparse: true });
schema.index({ status: 1, createdAt: -1 }, { partialFilterExpression: { deleted: false } });

const AccountCompany = mongoose.model<IAccountCompany>("AccountCompany", schema, "accounts_company");

export default AccountCompany;
