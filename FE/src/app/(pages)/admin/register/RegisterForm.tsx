"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { FaEye, FaEyeSlash } from "react-icons/fa6";
import { toast } from "sonner";
import { registerSchema, type RegisterFormData } from "@/schemas/auth.schema";

export const RegisterForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: data.fullName, email: data.email, password: data.password }),
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      if (result.code === "success") {
        toast.success("Registered! Your account needs to be activated by an admin before you can log in.");
        router.push("/admin/login");
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <form className="grid grid-cols-1 gap-y-[15px]" onSubmit={handleSubmit(onSubmit, (errs) => {
      const first = Object.values(errs)[0];
      if (first?.message) toast.error(first.message as string);
    })}>
      <div>
        <label htmlFor="fullName" className="font-[500] text-[14px] text-black mb-[5px] block">Full Name *</label>
        <input type="text" id="fullName" autoComplete="name"
          className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
          {...register("fullName")} />
        {errors.fullName && <p className="text-red-500 text-[12px] mt-[4px]">{errors.fullName.message}</p>}
      </div>
      <div>
        <label htmlFor="email" className="font-[500] text-[14px] text-black mb-[5px] block">Email *</label>
        <input type="email" id="email" autoComplete="email"
          className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
          {...register("email")} />
        {errors.email && <p className="text-red-500 text-[12px] mt-[4px]">{errors.email.message}</p>}
      </div>
      <div>
        <label htmlFor="password" className="font-[500] text-[14px] text-black mb-[5px] block">Password *</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} id="password" autoComplete="new-password"
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] pr-[50px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
            {...register("password")} />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-[15px] top-1/2 -translate-y-1/2 text-[#666] hover:text-[#333] cursor-pointer">
            {showPassword ? <FaEyeSlash className="text-[18px]" /> : <FaEye className="text-[18px]" />}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-[12px] mt-[4px]">{errors.password.message}</p>}
      </div>
      <p className="text-[12px] text-[#999] bg-[#FFF8E1] border border-[#FFE082] rounded-[6px] px-[12px] py-[8px]">
        Note: Your account will be set to <strong>pending</strong> after registration. An existing admin must activate it in the database before you can log in.
      </p>
      <button type="submit" disabled={isSubmitting}
        className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
        Register
      </button>
    </form>
  );
};
