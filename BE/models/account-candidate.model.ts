import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    avatar: String,
    phone: String,
    password: String,
    studentId: String, 
    isVerified: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ["initial", "active", "inactive"],
      default: "initial"
    }
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

const AccountCandidate = mongoose.model('AccountCandidate', schema, "accounts-candidate");

export default AccountCandidate;