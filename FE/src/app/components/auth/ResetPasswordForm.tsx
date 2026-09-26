"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { resetPasswordSchema, type ResetPasswordFormData } from "@/schemas/auth.schema";
import type { AuthRoleConfig } from "@/configs/auth";
import { AuthPasswordField, AuthSubmitButton, toastFirstError } from "./fields";

interface AuthResponse {
  code?: string;
  message?: string;
}

export const ResetPasswordForm = ({ config }: { config: AuthRoleConfig }) => {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${config.apiPrefix}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ password: data.password }),
      });
      if (res.status === 401 || res.status === 403) {
        toast.error("Session expired. Please restart the password reset process.");
        setTimeout(() => { window.location.href = `${config.basePath}/forgot-password`; }, 1500);
        return;
      }
      const resData: AuthResponse = await res.json();
      if (resData.code === "success") {
        toast.success(resData.message);
        setTimeout(() => { window.location.href = `${config.basePath}/login`; }, 500);
        return;
      }
      toast.error(resData.message || "Something went wrong. Please try again.");
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <form className="grid grid-cols-1 gap-y-[15px]" onSubmit={handleSubmit(onSubmit, toastFirstError(toast.error))}>
      <AuthPasswordField id="password" label="New Password" autoComplete="new-password" placeholder="Enter new password" error={errors.password} registration={register("password")} />
      <AuthPasswordField id="confirmPassword" label="Confirm Password" autoComplete="new-password" placeholder="Confirm new password" error={errors.confirmPassword} registration={register("confirmPassword")} />
      <AuthSubmitButton disabled={isSubmitting}>Reset Password</AuthSubmitButton>
    </form>
  );
};
