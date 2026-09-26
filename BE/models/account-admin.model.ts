import mongoose from "mongoose";
import { IAccountAdmin } from "../interfaces/models/account-admin.interface";

const schema = new mongoose.Schema<IAccountAdmin>(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    phone: String,
    avatar: String,
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    isSuperAdmin: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["initial", "active", "inactive"],
      default: "initial"
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ email: 1 }, { unique: true });
schema.index({ status: 1, createdAt: -1 }, { partialFilterExpression: { deleted: false } });

const AccountAdmin = mongoose.model<IAccountAdmin>("AccountAdmin", schema, "accounts_admin");
export default AccountAdmin;
