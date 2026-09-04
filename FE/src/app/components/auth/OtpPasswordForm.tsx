"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { otpPasswordSchema, type OtpPasswordFormData } from "@/schemas/auth.schema";
import type { AuthRoleConfig } from "@/configs/auth";
import { AuthSubmitButton, toastFirstError } from "./fields";

interface AuthResponse {
  code?: string;
  message?: string;
}

export const OtpPasswordForm = ({ config }: { config: AuthRoleConfig }) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isReady, setIsReady] = useState(false);
  const submitTimer = useRef<number | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<OtpPasswordFormData>({
    resolver: zodResolver(otpPasswordSchema),
  });

  useEffect(() => {
    const urlEmail = searchParams.get("email");
    if (urlEmail) {
      sessionStorage.setItem("forgotPasswordEmail", urlEmail);
      setIsReady(true);
      return;
    }
    if (!sessionStorage.getItem("forgotPasswordEmail")) {
      router.push(`${config.basePath}/forgot-password`);
      return;
    }
    setIsReady(true);
  }, [router, searchParams, config.basePath]);

  const onSubmit = async (data: OtpPasswordFormData) => {
    const email = sessionStorage.getItem("forgotPasswordEmail");
    if (!email) {
      toast.error("Session expired. Please restart the password reset process.");
      router.push(`${config.basePath}/forgot-password`);
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${config.apiPrefix}/otp-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, otp: data.otp }),
      });
      const resData: AuthResponse = await res.json();
      if (resData.code === "success") {
        toast.success(resData.message);
        sessionStorage.removeItem("forgotPasswordEmail");
        window.location.href = `${config.basePath}/reset-password`;
        return;
      }
      toast.error(resData.message || "Invalid OTP. Please try again.");
      reset();
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  const otpValue = watch("otp");
  useEffect(() => {
    if (!isReady || !otpValue || otpValue.length !== 6) return;
    if (submitTimer.current) window.clearTimeout(submitTimer.current);
    submitTimer.current = window.setTimeout(() => void handleSubmit(onSubmit)(), 300);
    return () => {
      if (submitTimer.current) window.clearTimeout(submitTimer.current);
    };
  }, [otpValue, isReady]);

  if (!isReady) {
    return (
      <div className="text-center py-[20px]">
        <p className="text-[#666]">Loading...</p>
      </div>
    );
  }

  const otpField = register("otp");

  return (
    <div className="max-w-[420px] mx-auto bg-white border border-[#E8E8E8] rounded-[12px] p-[24px] shadow-sm">
      <div className="text-center mb-[16px]">
        <div className="text-[18px] font-[700] text-[#121212]">Enter OTP</div>
        <p className="text-[13px] text-[#666] mt-[6px]">We sent a 6-digit code to your email.</p>
      </div>
      <form className="grid grid-cols-1 gap-y-[14px]" onSubmit={handleSubmit(onSubmit, toastFirstError(toast.error))}>
        <div>
          <label htmlFor="otp" className="font-[500] text-[13px] text-black mb-[6px] block">OTP Code *</label>
          <input
            type="text"
            id="otp"
            placeholder="000000"
            maxLength={6}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="one-time-code"
            {...otpField}
            onChange={(e) => {
              e.target.value = e.target.value.replace(/\D/g, "");
              otpField.onChange(e);
            }}
            className="w-full h-[50px] rounded-[10px] border border-[#DEDEDE] px-[16px] font-[600] text-[18px] text-black text-center tracking-[6px] focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200 font-mono"
          />
          {errors.otp && <p className="text-red-500 text-[12px] mt-[4px] text-center">{errors.otp.message}</p>}
          <p className="text-[12px] text-[#777] mt-[6px] text-center">Code is 6 digits. Check your spam folder if you can&apos;t find it.</p>
        </div>
        <AuthSubmitButton disabled={isSubmitting}>Verify OTP</AuthSubmitButton>
        <div className="text-center text-[13px]">
          Didn&apos;t get it?{" "}
          <Link href={`${config.basePath}/forgot-password`} className="font-[600] text-[#0088FF] hover:underline">Resend OTP</Link>
        </div>
      </form>
    </div>
  );
};
