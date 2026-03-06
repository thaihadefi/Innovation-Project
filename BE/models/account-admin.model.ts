import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true, select: false },
    phone: String,
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" }, // RBAC role
    status: {
      type: String,
      enum: ["initial", "active", "inactive"],
      default: "initial" // Must be manually activated in DB
    },
    deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

schema.index({ email: 1 }, { unique: true });
schema.index({ status: 1, createdAt: -1 });

const AccountAdmin = mongoose.model("AccountAdmin", schema, "accounts-admin");
export default AccountAdmin;
