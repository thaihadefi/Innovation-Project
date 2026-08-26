import AccountAdmin from "../../models/account-admin.model";
import Role from "../../models/role.model";
import { hashPassword, comparePassword } from "../../helpers/security.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { sendForgotPasswordOtpFlow, verifyForgotPasswordOtpFlow } from "../../helpers/password-reset-otp.helper";
import { signAuthToken } from "../../helpers/jwt.helper";
import { IAccountAdmin } from "../../interfaces/models/account-admin.interface";
import { IRole } from "../../interfaces/models/role.interface";

export interface AdminRegisterDTO {
  fullName: string;
  email: string;
  password: string;
  phone?: string;
}

export const registerAdminService = async (
  data: AdminRegisterDTO
): Promise<{ status: number; code: string; message: string }> => {
  const exist = await AccountAdmin.findOne({ email: data.email, deleted: false }).select("_id").lean();
  if (exist) {
    return { status: 409, code: "error", message: "Email already exists in the system." };
  }

  const hashedPassword = await hashPassword(data.password);

  try {
    const newAdmin = new AccountAdmin({
      ...data,
      password: hashedPassword,
      status: "initial",
      isSuperAdmin: false
    });
    await newAdmin.save();
    return { status: 200, code: "success", message: "Account created! Please wait for activation by an existing admin." };
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return { status: 409, code: "error", message: "Email already exists in the system." };
    }
    throw error;
  }
};

export const loginAdminService = async (
  email: string,
  password: string,
  rememberPassword?: boolean
): Promise<{ status: number; code: string; message: string; token?: string }> => {
  const admin = await AccountAdmin.findOne({ email, deleted: false }).select("+password");
  if (!admin || !(await comparePassword(password, `${admin.password}`))) {
    return { status: 401, code: "error", message: "Invalid email or password." };
  }

  if (admin.status !== "active") {
    return { status: 403, code: "error", message: "Account is not activated. Please contact another admin." };
  }

  const token = signAuthToken(
    { id: admin.id, email: admin.email, role: "admin" },
    rememberPassword
  );

  return { status: 200, code: "success", message: "Login successful.", token };
};

export const forgotPasswordAdminService = async (
  email: string
): Promise<{ status: number; code: string; message: string }> => {
  const admin = await AccountAdmin.findOne({ email, deleted: false }).select("_id").lean();
  if (!admin) {
    return { status: 400, code: "error", message: "This email is not registered in our system." };
  }

  return sendForgotPasswordOtpFlow(email, "admin");
};

export const verifyOtpAdminService = async (
  email: string,
  otp: string
): Promise<{ status: number; code: string; message: string; token?: string }> => {
  const admin = await AccountAdmin.findOne({ email, deleted: false }).select("_id email");
  if (!admin) {
    return { status: 400, code: "error", message: "Invalid email or OTP." };
  }

  const isValid = await verifyForgotPasswordOtpFlow(email, otp, "admin");
  if (!isValid) {
    return { status: 400, code: "error", message: "Invalid email or OTP." };
  }

  const token = signAuthToken({
    id: admin.id,
    email: admin.email,
    role: "admin",
  });

  return { status: 200, code: "success", message: "OTP verified successfully.", token };
};

export const resetPasswordAdminService = async (
  adminId: string,
  password: string
): Promise<{ status: number; code: string; message: string }> => {
  const admin = await AccountAdmin.findById(adminId).select("+password");
  if (!admin) {
    return { status: 404, code: "error", message: "Account not found." };
  }

  if (await comparePassword(password, `${admin.password}`)) {
    return { status: 409, code: "error", message: "New password must be different from the current password." };
  }

  const hashedPassword = await hashPassword(password);
  await AccountAdmin.updateOne({ _id: admin._id }, { password: hashedPassword });

  if (admin.email) {
    const { subject, html } = emailTemplates.passwordChanged(admin.email);
    void sendEmail(admin.email, subject, html).catch(() => {});
  }

  return { status: 200, code: "success", message: "Password changed successfully." };
};

export const checkAdminAuthService = async (
  admin: IAccountAdmin,
  permissions: string[] = []
): Promise<{ code: string; info: unknown }> => {
  const role = admin.role
    ? await Role.findOne({ _id: admin.role, deleted: false }).select("name permissions").lean<IRole>()
    : null;

  return {
    code: "success",
    info: {
      id: admin._id,
      fullName: admin.fullName,
      email: admin.email,
      avatar: admin.avatar || null,
      isSuperAdmin: admin.isSuperAdmin || false,
      role: role ? { id: role._id, name: role.name } : null,
      permissions: admin.isSuperAdmin ? null : permissions,
    },
  };
};
