"use client";
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { otpPasswordSchema, type OtpPasswordFormData } from '@/schemas/auth.schema';

export const OtpPasswordForm = () => {
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
  const submitTimerRef = useRef<number | null>(null);

  const { register, handleSubmit, watch, reset, formState: { errors, isSubmitting } } = useForm<OtpPasswordFormData>({
    resolver: zodResolver(otpPasswordSchema),
  });

  useEffect(() => {
    const storedEmail = sessionStorage.getItem("forgotPasswordEmailCompany");
    if (!storedEmail) {
      router.push("/company/forgot-password");
      return;
    }
    setIsReady(true);
  }, [router]);

  // Auto-submit when 6 digits entered
  const otpValue = watch("otp");
  useEffect(() => {
    if (!isReady || !otpValue || otpValue.length !== 6) return;
    if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
    submitTimerRef.current = window.setTimeout(() => {
      handleSubmit(onSubmit)();
    }, 300);
    return () => {
      if (submitTimerRef.current) window.clearTimeout(submitTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otpValue, isReady]);

  const onSubmit = async (data: OtpPasswordFormData) => {
    const storedEmail = sessionStorage.getItem("forgotPasswordEmailCompany");
    if (!storedEmail) {
      toast.error("Session expired. Please restart the password reset process.");
      router.push("/company/forgot-password");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/otp-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: storedEmail, otp: data.otp }),
        credentials: "include"
      });
      const result = await res.json();
      if (result.code == "error") { toast.error(result.message); reset(); }
      if (result.code == "success") {
        toast.success(result.message);
        sessionStorage.removeItem("forgotPasswordEmailCompany");
        router.push("/company/reset-password");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  if (!isReady) {
    return (
      <div className="text-center py-[20px]">
        <p className="text-[#666]">Loading...</p>
      </div>
    );
  }

  const otpFieldProps = register("otp");

  return (
    <>
      <div className="max-w-[420px] mx-auto bg-white border border-[#E8E8E8] rounded-[12px] p-[24px] shadow-sm">
        <div className="text-center mb-[16px]">
          <div className="text-[18px] font-[700] text-[#121212]">Enter OTP</div>
          <p className="text-[13px] text-[#666] mt-[6px]">We sent a 6-digit code to your email.</p>
        </div>
        <form className="grid grid-cols-1 gap-y-[14px]" onSubmit={handleSubmit(onSubmit, (errors) => {
          const firstError = Object.values(errors)[0];
          if (firstError?.message) toast.error(firstError.message as string);
        })}>
          <div className="">
            <label htmlFor="otp" className="font-[500] text-[13px] text-black mb-[6px] block">OTP Code *</label>
            <input
              type="text" id="otp" placeholder="000000" maxLength={6}
              inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code"
              {...otpFieldProps}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "");
                otpFieldProps.onChange(e);
              }}
              className="w-full h-[50px] rounded-[10px] border border-[#DEDEDE] px-[16px] font-[600] text-[18px] text-black text-center tracking-[6px] focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200 font-mono"
            />
            {errors.otp && <p className="text-red-500 text-[12px] mt-[4px] text-center">{errors.otp.message}</p>}
            <p className="text-[12px] text-[#777] mt-[6px] text-center">Code is 6 digits. Check your spam folder if you can't find it.</p>
          </div>
          <div className="">
            <button type="submit" disabled={isSubmitting} className="w-full h-[48px] rounded-[10px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
              Verify OTP
            </button>
          </div>
          <div className="text-center text-[13px]">
            Didn&apos;t get it?{" "}
            <Link href="/company/forgot-password" className="font-[600] text-[#0088FF] hover:underline">Resend OTP</Link>
          </div>
        </form>
      </div>
    </>
  );
};
