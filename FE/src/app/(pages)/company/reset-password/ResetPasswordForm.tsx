"use client";
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { toast } from 'sonner';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/schemas/auth.schema';

export const ResetPasswordForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: data.password }),
        credentials: "include"
      });
      const result = await res.json();
      if (result.code == "error") toast.error(result.message);
      if (result.code == "success") {
        toast.success(result.message);
        setTimeout(() => router.push("/company/login"), 500);
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <>
      <form className="grid grid-cols-1 gap-y-[15px]" onSubmit={handleSubmit(onSubmit, (errors) => {
        const firstError = Object.values(errors)[0];
        if (firstError?.message) toast.error(firstError.message as string);
      })}>
        <div className="">
          <label htmlFor="password" className="font-[500] text-[14px] text-black mb-[5px]">New Password *</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} id="password"
              placeholder="Enter new password" autoComplete="new-password"
              className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] pr-[50px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("password")} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#666] hover:text-[#333] cursor-pointer transition-colors duration-200">
              {showPassword ? <FaEyeSlash className="text-[18px]" /> : <FaEye className="text-[18px]" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-[12px] mt-[4px]">{errors.password.message}</p>}
        </div>
        <div className="">
          <label htmlFor="confirmPassword" className="font-[500] text-[14px] text-black mb-[5px]">Confirm Password *</label>
          <div className="relative">
            <input type={showConfirmPassword ? "text" : "password"} id="confirmPassword"
              placeholder="Confirm new password" autoComplete="new-password"
              className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] pr-[50px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("confirmPassword")} />
            <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#666] hover:text-[#333] cursor-pointer transition-colors duration-200">
              {showConfirmPassword ? <FaEyeSlash className="text-[18px]" /> : <FaEye className="text-[18px]" />}
            </button>
          </div>
          {errors.confirmPassword && <p className="text-red-500 text-[12px] mt-[4px]">{errors.confirmPassword.message}</p>}
        </div>
        <div className="">
          <button type="submit" disabled={isSubmitting} className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
            Reset Password
          </button>
        </div>
      </form>
    </>
  );
};
