"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { forgotPasswordSchema, type ForgotPasswordFormData } from "@/schemas/auth.schema";
import type { AuthRoleConfig } from "@/configs/auth";
import { AuthSubmitButton, AuthTextField, toastFirstError } from "./fields";

interface AuthResponse {
  code?: string;
  message?: string;
}

export const ForgotPasswordForm = ({ config }: { config: AuthRoleConfig }) => {
  const searchParams = useSearchParams();
  const autoSent = useRef(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: searchParams.get("email") || "" },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${config.apiPrefix}/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: data.email }),
      });
      const resData: AuthResponse = await res.json();
      if (resData.code === "success") {
        toast.success(resData.message);
        sessionStorage.setItem("forgotPasswordEmail", data.email);
        window.location.href = `${config.basePath}/otp-password`;
        return;
      }
      toast.error(resData.message || "Something went wrong. Please try again.");
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  useEffect(() => {
    if (autoSent.current) return;
    const email = searchParams.get("email");
    if (searchParams.get("autoSend") === "true" && email) {
      autoSent.current = true;
      void onSubmit({ email });
    }
  }, []);

  return (
    <form className="grid grid-cols-1 gap-y-[15px]" onSubmit={handleSubmit(onSubmit, toastFirstError(toast.error))}>
      <AuthTextField
        id="email"
        label="Email"
        type="email"
        autoComplete="email"
        placeholder="Enter your email"
        error={errors.email}
        registration={register("email")}
      />
      <AuthSubmitButton disabled={isSubmitting}>Send OTP</AuthSubmitButton>
      <div className="text-center">
        <Link href={`${config.basePath}/login`} className="font-[500] text-[14px] text-[#0088FF] hover:underline">Back to Login</Link>
      </div>
    </form>
  );
};
