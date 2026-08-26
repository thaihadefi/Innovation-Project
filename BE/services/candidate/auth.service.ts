import AccountCandidate from "../../models/account-candidate.model";
import { hashPassword, comparePassword } from "../../helpers/security.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { sendForgotPasswordOtpFlow, verifyForgotPasswordOtpFlow } from "../../helpers/password-reset-otp.helper";
import { signAuthToken } from "../../helpers/jwt.helper";

export interface CandidateRegisterDTO {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
  studentId?: string;
}

export const registerCandidateService = async (
  data: CandidateRegisterDTO
): Promise<{ status: number; code: string; message: string }> => {
  const existAccount = await AccountCandidate.findOne({
    email: data.email
  }).select("_id").lean();

  if (existAccount) {
    return { status: 409, code: "error", message: "Email already exists in the system." };
  }

  const hashedPassword = await hashPassword(data.password);

  try {
    const newAccount = new AccountCandidate({
      ...data,
      password: hashedPassword,
      status: "active",
      isVerified: false
    });
    await newAccount.save();

    return {
      status: 200,
      code: "success",
      message: "Account created successfully. Please login to continue."
    };
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return { status: 409, code: "error", message: "Email already exists in the system." };
    }
    throw error;
  }
};

export const loginCandidateService = async (
  email: string,
  password: string,
  rememberPassword?: boolean
): Promise<{ status: number; code: string; message: string; token?: string }> => {
  const existAccount = await AccountCandidate.findOne({ email }).select("+password email isVerified status");

  if (!existAccount) {
    return { status: 401, code: "error", message: "Invalid email or password." };
  }

  const isPasswordValid = await comparePassword(password, `${existAccount.password}`);
  if (!isPasswordValid) {
    return { status: 401, code: "error", message: "Invalid email or password." };
  }

  if (existAccount.status !== "active") {
    return { status: 403, code: "error", message: "Your account is inactive. Please contact support." };
  }

  const token = signAuthToken(
    {
      id: existAccount.id,
      email: existAccount.email,
      role: "candidate",
    },
    rememberPassword
  );

  return { status: 200, code: "success", message: "Login successful.", token };
};

export const forgotPasswordCandidateService = async (
  email: string
): Promise<{ status: number; code: string; message: string }> => {
  const existAccount = await AccountCandidate.findOne({ email }).select("_id").lean();
  if (!existAccount) {
    return { status: 400, code: "error", message: "This email is not registered in our system." };
  }

  return sendForgotPasswordOtpFlow(email, "candidate");
};

export const verifyOtpCandidateService = async (
  email: string,
  otp: string
): Promise<{ status: number; code: string; message: string; token?: string }> => {
  const existAccount = await AccountCandidate.findOne({ email }).select("_id email");
  if (!existAccount) {
    return { status: 400, code: "error", message: "Invalid email or OTP." };
  }

  const isValid = await verifyForgotPasswordOtpFlow(email, otp, "candidate");
  if (!isValid) {
    return { status: 400, code: "error", message: "Invalid email or OTP." };
  }

  const token = signAuthToken({
    id: existAccount.id,
    email: existAccount.email,
    role: "candidate",
  });

  return { status: 200, code: "success", message: "OTP verified successfully.", token };
};

export const resetPasswordCandidateService = async (
  candidateId: string,
  password: string
): Promise<{ status: number; code: string; message: string }> => {
  const existAccount = await AccountCandidate.findById(candidateId).select("+password");
  if (!existAccount) {
    return { status: 404, code: "error", message: "Account not found." };
  }

  const isSamePassword = await comparePassword(password, `${existAccount.password}`);
  if (isSamePassword) {
    return { status: 409, code: "error", message: "New password must be different from the current password." };
  }

  const hashedPassword = await hashPassword(password);
  await AccountCandidate.updateOne({ _id: candidateId }, { password: hashedPassword });

  if (existAccount.email) {
    const { subject, html } = emailTemplates.passwordChanged(existAccount.email);
    void sendEmail(existAccount.email, subject, html).catch(() => {});
  }

  return { status: 200, code: "success", message: "Password has been changed successfully." };
};
