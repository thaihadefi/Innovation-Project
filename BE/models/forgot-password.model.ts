import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email:       { type: String, required: true },
  otp:         { type: String, required: true },
  accountType: { type: String, enum: ["candidate", "company", "admin"], required: true },
  expireAt:    { type: Date, required: true }, // TTL index below handles auto-purge
}, {
  timestamps: true
});

// Auto-delete expired OTP records (MongoDB checks expireAt every 60 s)
schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
// Email lookup
schema.index({ email: 1 });
// One pending OTP per email+accountType at a time (atomic upsert safety)
schema.index({ email: 1, accountType: 1 }, { unique: true });

const ForgotPassword = mongoose.model("ForgotPassword", schema, "forgot_passwords");
export default ForgotPassword;
