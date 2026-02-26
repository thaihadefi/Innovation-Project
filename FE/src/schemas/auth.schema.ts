import { z } from 'zod';

export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters!")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter!")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter!")
  .regex(/\d/, "Password must contain at least one digit!")
  .regex(/[~!@#$%^&*]/, "Password must contain at least one special character! (~!@#$%^&*)");

const emailField = z.string()
  .min(1, "Please enter email!")
  .email("Invalid email format!");

export const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Please enter password!"),
  rememberPassword: z.boolean().optional(),
});

export const registerSchema = z.object({
  fullName: z.string()
    .min(1, "Please enter full name!")
    .min(5, "Full name must be at least 5 characters!")
    .max(50, "Full name must not exceed 50 characters!"),
  email: emailField,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailField,
});

export const resetPasswordSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, "Please confirm password!"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match!",
  path: ["confirmPassword"],
});

export const otpPasswordSchema = z.object({
  otp: z.string()
    .length(6, "OTP must be 6 digits!")
    .regex(/^[0-9]{6}$/, "OTP must be digits only!"),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type OtpPasswordFormData = z.infer<typeof otpPasswordSchema>;
