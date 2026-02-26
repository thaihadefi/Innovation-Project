"use client";
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/auth.schema';

export const ForgotPasswordForm = () => {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });
      const result = await res.json();
      if (result.code == "error") toast.error(result.message);
      if (result.code == "success") {
        toast.success(result.message);
        sessionStorage.setItem("forgotPasswordEmailCompany", data.email);
        router.push("/company/otp-password");
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
          <label htmlFor="email" className="font-[500] text-[14px] text-black mb-[5px]">Email *</label>
          <input type="email" id="email" placeholder="Enter your email" autoComplete="email"
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
            {...register("email")} />
          {errors.email && <p className="text-red-500 text-[12px] mt-[4px]">{errors.email.message}</p>}
        </div>
        <div className="">
          <button type="submit" disabled={isSubmitting} className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
            Send OTP
          </button>
        </div>
        <div className="text-center">
          <Link href="/company/login" className="font-[500] text-[14px] text-[#0088FF] hover:underline">Back to Login</Link>
        </div>
      </form>
    </>
  );
};
