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
schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

const ForgotPassword = mongoose.model('ForgotPassword', schema, "forgot-password");

export default ForgotPassword;
