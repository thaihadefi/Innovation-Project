import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    accountId: { 
      type: mongoose.Schema.Types.ObjectId, 
      required: true 
    },
    accountType: { 
      type: String, 
      enum: ["candidate", "company"], 
      required: true 
    },
    newEmail: { 
      type: String, 
      required: true 
    },
    otp: { 
      type: String, 
      required: true 
    },
    expireAt: {
      type: Date,
      required: true
    }
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired requests
schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ accountId: 1, accountType: 1 }, { unique: true }); // enforces one pending request per account at a time

const EmailChangeRequest = mongoose.model('EmailChangeRequest', schema, "email_change_requests");

export default EmailChangeRequest;
