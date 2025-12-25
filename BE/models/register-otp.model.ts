import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    email: String,
    otp: String,
    expireAt: {
      type: Date,
      default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      expires: 0 // Auto delete when expired
    }
  },
  {
    timestamps: true
  }
);

const RegisterOtp = mongoose.model('RegisterOtp', schema, "register-otp");

export default RegisterOtp;
