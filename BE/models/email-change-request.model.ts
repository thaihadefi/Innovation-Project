import mongoose from "mongoose";
import { IEmailChangeRequest } from "../interfaces/models/email-change-request.interface";

const schema = new mongoose.Schema<IEmailChangeRequest>(
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

schema.index({ expireAt: 1 }, { expireAfterSeconds: 0 });
schema.index({ accountId: 1, accountType: 1 }, { unique: true });

const EmailChangeRequest = mongoose.model<IEmailChangeRequest>('EmailChangeRequest', schema, "email_change_requests");

export default EmailChangeRequest;
