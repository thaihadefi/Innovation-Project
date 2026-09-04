import mongoose from "mongoose";
import { IForgotPassword } from "../interfaces/models/forgot-password.interface";

const schema = new mongoose.Schema<IForgotPassword>({
  email:       { type: String, required: true },
  otp:         { type: String, required: true },
  accountType: { type: String, enum: ["candidate", "company", "admin"], required: true },
  expireAt:    { type: Date, required: true },
}, {
  timestamps: true
});

schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ email: 1 });
schema.index({ email: 1, accountType: 1 }, { unique: true });

const ForgotPassword = mongoose.model<IForgotPassword>("ForgotPassword", schema, "forgot_passwords");
export default ForgotPassword;
