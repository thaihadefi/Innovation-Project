import mongoose from "mongoose";

const schema = new mongoose.Schema({
  email: String,
  otp: String,
  accountType: String, // "candidate" or "company"
  expireAt: {
    type: Date,
    expires: 0
  }
}, {
  timestamps: true
});

// Index for email lookup
schema.index({ email: 1 });
// Unique compound index: ensures atomic upsert (only one pending OTP per email+accountType at a time)
schema.index({ email: 1, accountType: 1 }, { unique: true });

const ForgotPassword = mongoose.model('ForgotPassword', schema, "forgot-password");

export default ForgotPassword;
