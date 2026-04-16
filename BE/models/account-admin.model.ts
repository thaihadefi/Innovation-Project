import mongoose from "mongoose";
import { softDeletePlugin } from "../helpers/mongoose-plugins/soft-delete.plugin";

const schema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    phone: String,
    avatar: String,
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" }, // RBAC role
    isSuperAdmin: { type: Boolean, default: false }, // Only set via seed or manual DB update
    status: {
      type: String,
      enum: ["initial", "active", "inactive"],
      default: "initial" // Must be manually activated in DB
    },
    // deleted injected by softDeletePlugin below
  },
  { timestamps: true }
);

schema.plugin(softDeletePlugin);

schema.index({ email: 1 }, { unique: true });
schema.index({ status: 1, createdAt: -1 }, { partialFilterExpression: { deleted: false } });

const AccountAdmin = mongoose.model("AccountAdmin", schema, "accounts_admin");
export default AccountAdmin;
