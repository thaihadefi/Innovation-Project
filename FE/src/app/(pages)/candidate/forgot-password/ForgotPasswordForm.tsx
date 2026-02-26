"use client";
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/schemas/auth.schema';

export const ForgotPasswordForm = () => {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors } } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/forgot-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: data.email }),
    })
      .then(res => res.json())
      .then(res => {
        if (res.code == "error") toast.error(res.message);
        if (res.code == "success") {
          toast.success(res.message);
          sessionStorage.setItem("forgotPasswordEmail", data.email);
          router.push("/candidate/otp-password");
        }
      })
      .catch(() => toast.error("Network error. Please try again."));
  };

  return (
    <>
      <form className="grid grid-cols-1 gap-y-[15px]" onSubmit={handleSubmit(onSubmit)}>
        <div className="">
          <label htmlFor="email" className="font-[500] text-[14px] text-black mb-[5px]">Email *</label>
          <input
            type="email" id="email" placeholder="Enter your email" autoComplete="email"
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
            {...register("email")}
          />
          {errors.email && <p className="text-red-500 text-[12px] mt-[4px]">{errors.email.message}</p>}
        </div>
        <div className="">
          <button type="submit" className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
            Send OTP
          </button>
        </div>
        <div className="text-center">
          <Link href="/candidate/login" className="font-[500] text-[14px] text-[#0088FF] hover:underline">
            Back to Login
          </Link>
        </div>
      </form>
    </>
  );
};
