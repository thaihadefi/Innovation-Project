import ForgotPassword from "../models/forgot-password.model";
import { generateNumericOtp } from "./security.helper";
import { emailTemplates } from "./email-template.helper";
import { sendEmail } from "./mail.helper";

export type ResetAccountType = "candidate" | "company" | "admin";

export const sendForgotPasswordOtpFlow = async (
  email: string,
  accountType: ResetAccountType
): Promise<{ status: number; code: string; message: string }> => {
  const otp = generateNumericOtp(6);

  try {
    const existingOrNew = await ForgotPassword.findOneAndUpdate(
      { email, accountType },
      { $setOnInsert: { email, otp, accountType, expireAt: new Date(Date.now() + 5 * 60 * 1000) } },
      { upsert: true, new: false }
    );

    if (existingOrNew) {
      return {
        status: 200,
        code: "success",
        message: "OTP has already been sent to your email. Please check your inbox.",
      };
    }

    const { subject, html } = emailTemplates.forgotPasswordOtp(otp, accountType, email);
    try {
      await sendEmail(email, subject, html);
    } catch {
      await ForgotPassword.deleteOne({ email, accountType });
      return { status: 500, code: "error", message: "Failed to send OTP email. Please try again." };
    }

    return { status: 200, code: "success", message: "OTP has been sent to your email." };
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return {
        status: 200,
        code: "success",
        message: "OTP has already been sent to your email. Please check your inbox.",
      };
    }
    throw error;
  }
};

export const verifyForgotPasswordOtpFlow = async (
  email: string,
  otp: string,
  accountType: ResetAccountType
): Promise<boolean> => {
  const record = await ForgotPassword.findOne({
    email,
    otp,
    accountType,
    expireAt: { $gt: new Date() },
  }).select("_id");

  if (!record) {
    return false;
  }

  await ForgotPassword.deleteOne({ _id: record._id });
  return true;
};
