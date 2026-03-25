import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AccountAdmin from "../../models/account-admin.model";
import Role from "../../models/role.model";
import ForgotPassword from "../../models/forgot-password.model";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { RequestAdmin } from "../../interfaces/request.interface";

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export const registerPost = async (req: Request, res: Response) => {
  try {
    const exist = await AccountAdmin.findOne({ email: req.body.email, deleted: false });
    if (exist) {
      res.status(409).json({ code: "error", message: "Email already exists in the system." });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
    const newAdmin = new AccountAdmin({ ...req.body, status: "initial", isSuperAdmin: false });
    await newAdmin.save();
    res.json({ code: "success", message: "Account created! Please wait for activation by an existing admin." });
  } catch (error: any) {
    if (error.code === 11000) {
      res.status(409).json({ code: "error", message: "Email already exists in the system." });
      return;
    }
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberPassword } = req.body;
    const admin = await AccountAdmin.findOne({ email, deleted: false }).select("+password");
    if (!admin || !(await bcrypt.compare(password, `${admin.password}`))) {
      res.status(401).json({ code: "error", message: "Invalid email or password." });
      return;
    }
    if (admin.status !== "active") {
      res.status(403).json({ code: "error", message: "Account is not activated. Please contact another admin." });
      return;
    }
    const token = jwt.sign({ id: admin.id, email: admin.email, role: "admin" }, `${process.env.JWT_SECRET}`, {
      expiresIn: rememberPassword ? "7d" : "1d",
    });
    res.cookie("adminToken", token, {
      maxAge: rememberPassword ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
      ...COOKIE_OPTS,
    });
    res.json({ code: "success", message: "Login successful." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const forgotPasswordPost = async (req: Request, res: Response) => {
  try {
    const email = req.body.email as string;
    const admin = await AccountAdmin.findOne({ email, deleted: false }).select("_id");
    if (!admin) {
      res.status(400).json({ code: "error", message: "This email is not registered in our system." });
      return;
    }
    const otp = generateRandomNumber(6);
    const existingOrNew = await ForgotPassword.findOneAndUpdate(
      { email, accountType: "admin" },
      { $setOnInsert: { email, otp, accountType: "admin", expireAt: new Date(Date.now() + 5 * 60 * 1000) } },
      { upsert: true, new: false }
    );
    if (existingOrNew) {
      res.json({ code: "success", message: "OTP has already been sent to your email. Please check your inbox." });
      return;
    }
    const { subject, html } = emailTemplates.forgotPasswordOtp(otp);
    try {
      await sendEmail(email, subject, html);
    } catch {
      await ForgotPassword.deleteOne({ email, accountType: "admin" });
      res.status(500).json({ code: "error", message: "Failed to send OTP email. Please try again." });
      return;
    }
    res.json({ code: "success", message: "OTP has been sent to your email." });
  } catch (error: any) {
    if (error.code === 11000) {
      res.json({ code: "success", message: "OTP has already been sent to your email. Please check your inbox." });
      return;
    }
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const otpPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const admin = await AccountAdmin.findOne({ email, deleted: false }).select("_id email");
    if (!admin) {
      res.status(400).json({ code: "error", message: "Invalid email or OTP." });
      return;
    }
    const record = await ForgotPassword.findOne({ email, otp, accountType: "admin", expireAt: { $gt: new Date() } });
    if (!record) {
      res.status(400).json({ code: "error", message: "Invalid email or OTP." });
      return;
    }
    await ForgotPassword.deleteOne({ _id: record._id });
    const token = jwt.sign({ id: admin.id, email: admin.email, role: "admin" }, `${process.env.JWT_SECRET}`, { expiresIn: "1d" });
    res.cookie("adminToken", token, { maxAge: 24 * 60 * 60 * 1000, ...COOKIE_OPTS });
    res.json({ code: "success", message: "OTP verified successfully." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const resetPasswordPost = async (req: RequestAdmin, res: Response) => {
  try {
    const { password } = req.body;
    const admin = await AccountAdmin.findById(req.admin.id).select("+password");
    if (!admin) {
      res.status(404).json({ code: "error", message: "Account not found." });
      return;
    }
    if (await bcrypt.compare(password, `${admin.password}`)) {
      res.status(409).json({ code: "error", message: "New password must be different from the current password." });
      return;
    }
    const salt = await bcrypt.genSalt(10);
    await AccountAdmin.updateOne({ _id: admin._id }, { password: await bcrypt.hash(password, salt) });

    // Notify account owner — if this wasn't them, they can act immediately (fire-and-forget)
    if (admin.email) {
      const { subject, html } = emailTemplates.passwordChanged(admin.email);
      void sendEmail(admin.email, subject, html).catch(() => {});
    }

    res.clearCookie("adminToken", COOKIE_OPTS);
    res.json({ code: "success", message: "Password changed successfully." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const logout = (_req: Request, res: Response) => {
  res.clearCookie("adminToken", COOKIE_OPTS);
  res.json({ code: "success", message: "Logged out." });
};

export const checkAuth = async (req: RequestAdmin, res: Response) => {
  try {
    const role = req.admin.role
      ? await Role.findOne({ _id: req.admin.role, deleted: false }).select("name permissions").lean()
      : null;
    res.json({
      code: "success",
      info: {
        id: req.admin._id,
        fullName: req.admin.fullName,
        email: req.admin.email,
        avatar: (req.admin as any).avatar || null,
        isSuperAdmin: req.admin.isSuperAdmin || false,
        role: role ? { id: role._id, name: role.name } : null,
        permissions: req.admin.isSuperAdmin ? null : (req.permissions || []),
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
