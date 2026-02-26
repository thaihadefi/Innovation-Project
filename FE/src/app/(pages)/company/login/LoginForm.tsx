"use client";
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FaEye, FaEyeSlash } from 'react-icons/fa6';
import { toast } from 'sonner';
import { loginSchema, type LoginFormData } from '@/schemas/auth.schema';

export const LoginForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("redirect") || "/";
  const redirectTo = (raw.startsWith("/") && !raw.startsWith("//")) ? raw : "/";
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          rememberPassword: data.rememberPassword ?? false,
        }),
        credentials: "include"
      });
      const result = await res.json();
      if (result.code == "error") toast.error(result.message);
      if (result.code == "success") {
        toast.success(result.message);
        window.location.href = redirectTo;
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <>
      <form className="grid grid-cols-1 gap-y-[15px] gap-x-[20px]" onSubmit={handleSubmit(onSubmit, (errors) => {
        const firstError = Object.values(errors)[0];
        if (firstError?.message) toast.error(firstError.message as string);
      })}>
        <div className="">
          <label htmlFor="email" className="font-[500] text-[14px] text-black mb-[5px]">Email *</label>
          <input type="email" id="email" autoComplete="email"
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
            {...register("email")} />
          {errors.email && <p className="text-red-500 text-[12px] mt-[4px]">{errors.email.message}</p>}
        </div>
        <div className="">
          <label htmlFor="password" className="font-[500] text-[14px] text-black mb-[5px]">Password *</label>
          <div className="relative">
            <input type={showPassword ? "text" : "password"} id="password" autoComplete="current-password"
              className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] pr-[50px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("password")} />
            <button type="button" onClick={() => setShowPassword(!showPassword)}
              className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#666] hover:text-[#333] cursor-pointer transition-colors duration-200">
              {showPassword ? <FaEyeSlash className="text-[18px]" /> : <FaEye className="text-[18px]" />}
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-[12px] mt-[4px]">{errors.password.message}</p>}
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-[8px]">
            <input type="checkbox" id="rememberPassword" className="w-[16px] h-[16px] cursor-pointer"
              {...register("rememberPassword")} />
            <label htmlFor="rememberPassword" className="font-[500] text-[14px] text-black cursor-pointer">Remember me</label>
          </div>
          <Link href="/company/forgot-password" className="font-[500] text-[14px] text-[#0088FF] hover:underline">Forgot Password?</Link>
        </div>
        <div className="">
          <button type="submit" disabled={isSubmitting} className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
            Login
          </button>
        </div>
      </form>
    </>
  );
};
