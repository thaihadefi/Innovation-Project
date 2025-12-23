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
    expiredAt: { 
      type: Date, 
      required: true 
    }
  },
  {
    timestamps: true,
  }
);

// Auto-delete expired requests
schema.index({ expiredAt: 1 }, { expireAfterSeconds: 0 });

const EmailChangeRequest = mongoose.model('EmailChangeRequest', schema, "email_change_requests");

export default EmailChangeRequest;
