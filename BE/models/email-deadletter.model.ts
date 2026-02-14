import mongoose from "mongoose";

const EmailDeadletterSchema = new mongoose.Schema(
  {
    to: { type: String, required: true },
    subject: { type: String, required: true },
    html: { type: String, required: true },
    attempts: { type: Number, required: true, default: 0 },
    lastError: { type: String, required: true, default: "" },
  },
  {
    timestamps: true,
  }
);

const EmailDeadletter = mongoose.model("EmailDeadletter", EmailDeadletterSchema, "email_deadletters");

export default EmailDeadletter;

