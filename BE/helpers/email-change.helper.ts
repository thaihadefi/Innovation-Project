import { Types } from "mongoose";
import AccountCandidate from "../models/account-candidate.model";
import AccountCompany from "../models/account-company.model";
import EmailChangeRequest from "../models/email-change-request.model";
import { generateNumericOtp } from "./security.helper";
import { sendEmail } from "./mail.helper";
import { emailTemplates } from "./email-template.helper";
import { IEmailChangeRequest } from "../interfaces/models/email-change-request.interface";

export type EmailChangeAccountType = "candidate" | "company";

export interface RequestEmailChangeParams {
  accountId: Types.ObjectId;
  currentEmail?: string;
  newEmail: string;
  accountType: EmailChangeAccountType;
}

export const requestEmailChangeFlow = async ({
  accountId,
  currentEmail,
  newEmail,
  accountType,
}: RequestEmailChangeParams): Promise<{ status: number; code: string; message: string }> => {
  if (!newEmail || !newEmail.trim()) {
    return { status: 400, code: "error", message: "Please provide new email." };
  }

  const trimmedNewEmail = newEmail.trim().toLowerCase();

  if (trimmedNewEmail === currentEmail?.toLowerCase()) {
    return { status: 409, code: "error", message: "New email is same as current email." };
  }

  const [existCandidate, existCompany] = await Promise.all([
    AccountCandidate.findOne({ email: trimmedNewEmail }).select("_id").lean(),
    AccountCompany.findOne({ email: trimmedNewEmail }).select("_id").lean(),
  ]);

  if (existCandidate || existCompany) {
    return { status: 409, code: "error", message: "This email is already registered." };
  }

  const otp = generateNumericOtp(6);
  const expireAt = new Date(Date.now() + 10 * 60 * 1000);

  try {
    await EmailChangeRequest.findOneAndUpdate(
      { accountId, accountType },
      { $set: { newEmail: trimmedNewEmail, otp, expireAt } },
      { upsert: true }
    );

    const { subject: otpSubject, html: otpHtml } = emailTemplates.emailChangeOtp(otp, trimmedNewEmail);
    const { subject: alertSubject, html: alertHtml } = emailTemplates.emailChangeSecurityAlert(trimmedNewEmail);

    try {
      await sendEmail(trimmedNewEmail, otpSubject, otpHtml);
    } catch {
      await EmailChangeRequest.deleteOne({ accountId, accountType });
      return { status: 500, code: "error", message: "Failed to send OTP email. Please try again." };
    }

    if (currentEmail) {
      void sendEmail(currentEmail, alertSubject, alertHtml).catch(() => {});
    }

    return { status: 200, code: "success", message: "OTP sent to your new email." };
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return {
        status: 409,
        code: "error",
        message: "A request is already in progress. Please check your email for the OTP.",
      };
    }
    throw error;
  }
};

export const verifyEmailChangeOtpFlow = async (
  accountId: Types.ObjectId,
  otp: string,
  accountType: EmailChangeAccountType
): Promise<{ success: true; newEmail: string } | { success: false; message: string }> => {
  if (!otp || !otp.trim()) {
    return { success: false, message: "Please provide OTP." };
  }

  const request = await EmailChangeRequest.findOneAndDelete({
    accountId,
    accountType,
    otp: otp.trim(),
    expireAt: { $gt: new Date() },
  })
    .select("newEmail")
    .lean<IEmailChangeRequest>();

  if (!request || !request.newEmail) {
    return { success: false, message: "Invalid or expired OTP." };
  }

  return { success: true, newEmail: request.newEmail };
};
