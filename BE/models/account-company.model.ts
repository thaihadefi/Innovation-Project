import mongoose from "mongoose";
import { softDeletePlugin } from "../helpers/mongoose-plugins/soft-delete.plugin";

const schema = new mongoose.Schema(
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
    // deleted injected by softDeletePlugin below
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

schema.plugin(softDeletePlugin);

// Indexes for query optimization
schema.index({ email: 1 }, { unique: true }); // Email lookup (login, forgot password)
schema.index({ phone: 1 }, { unique: true, sparse: true }); // Phone must be unique; sparse allows null/missing
schema.index({ status: 1, createdAt: -1 }); // Admin listing with status filter

const AccountCompany = mongoose.model("AccountCompany", schema, "accounts_company");

export default AccountCompany;
