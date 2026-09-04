import AccountCompany from "../../models/account-company.model";
import { hashPassword, comparePassword } from "../../helpers/security.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { generateUniqueSlug } from "../../helpers/slugify.helper";
import { sendForgotPasswordOtpFlow, verifyForgotPasswordOtpFlow } from "../../helpers/password-reset-otp.helper";
import { signAuthToken } from "../../helpers/jwt.helper";

export interface CompanyRegisterDTO {
  companyName: string;
  email: string;
  password: string;
  location?: string;
  address?: string;
  companyModel?: string;
  companyEmployees?: string;
  workingTime?: string;
  workOverTime?: string;
  phone?: string;
  description?: string;
}

export const registerCompanyService = async (
  data: CompanyRegisterDTO
): Promise<{ status: number; code: string; message: string }> => {
  const existAccount = await AccountCompany.findOne({
    email: data.email
  }).select("_id").lean();

  if (existAccount) {
    return { status: 409, code: "error", message: "Email already exists in the system." };
  }

  const hashedPassword = await hashPassword(data.password);

  try {
    const newAccount = new AccountCompany({
      ...data,
      password: hashedPassword,
      status: "initial"
    });
    await newAccount.save();

    newAccount.slug = generateUniqueSlug(data.companyName, newAccount.id);
    await newAccount.save();

    return {
      status: 200,
      code: "success",
      message: "Registration submitted! Your account is pending admin approval."
    };
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return { status: 409, code: "error", message: "Email already exists in the system." };
    }
    throw error;
  }
};

export const loginCompanyService = async (
  email: string,
  password: string,
  rememberPassword?: boolean
): Promise<{ status: number; code: string; message: string; token?: string }> => {
  const existAccount = await AccountCompany.findOne({ email })
    .select("+password email companyName location address companyModel companyEmployees workingTime workOverTime phone description logo website status");

  if (!existAccount) {
    return { status: 401, code: "error", message: "Invalid email or password." };
  }

  const isPasswordValid = await comparePassword(password, `${existAccount.password}`);
  if (!isPasswordValid) {
    return { status: 401, code: "error", message: "Invalid email or password." };
  }

  if (existAccount.status !== "active") {
    return { status: 403, code: "error", message: "Your account is pending admin approval." };
  }

  const token = signAuthToken(
    {
      id: existAccount.id,
      email: existAccount.email,
      role: "company",
    },
    rememberPassword
  );

  return { status: 200, code: "success", message: "Login successful.", token };
};

export const forgotPasswordCompanyService = async (
  email: string
): Promise<{ status: number; code: string; message: string }> => {
  const existAccount = await AccountCompany.findOne({ email }).select("_id").lean();
  if (!existAccount) {
    return { status: 400, code: "error", message: "This email is not registered in our system." };
  }

  return sendForgotPasswordOtpFlow(email, "company");
};

export const verifyOtpCompanyService = async (
  email: string,
  otp: string
): Promise<{ status: number; code: string; message: string; token?: string }> => {
  const existAccount = await AccountCompany.findOne({ email }).select("_id email");
  if (!existAccount) {
    return { status: 400, code: "error", message: "Invalid email or OTP." };
  }

  const isValid = await verifyForgotPasswordOtpFlow(email, otp, "company");
  if (!isValid) {
    return { status: 400, code: "error", message: "Invalid email or OTP." };
  }

  const token = signAuthToken({
    id: existAccount.id,
    email: existAccount.email,
    role: "company",
  });

  return { status: 200, code: "success", message: "OTP verified successfully.", token };
};

export const resetPasswordCompanyService = async (
  companyId: string,
  password: string
): Promise<{ status: number; code: string; message: string }> => {
  const existAccount = await AccountCompany.findById(companyId).select("+password");
  if (!existAccount) {
    return { status: 404, code: "error", message: "Account not found." };
  }

  const isSamePassword = await comparePassword(password, `${existAccount.password}`);
  if (isSamePassword) {
    return { status: 409, code: "error", message: "New password must be different from current password." };
  }

  const hashedPassword = await hashPassword(password);
  await AccountCompany.updateOne({ _id: existAccount.id }, { password: hashedPassword });

  if (existAccount.email) {
    const { subject, html } = emailTemplates.passwordChanged(existAccount.email);
    void sendEmail(existAccount.email, subject, html).catch(() => {});
  }

  return { status: 200, code: "success", message: "Password has been changed successfully." };
};
