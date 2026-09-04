"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { loginSchema, type LoginFormData } from "@/schemas/auth.schema";
import type { AuthRoleConfig } from "@/configs/auth";
import { AuthPasswordField, AuthSubmitButton, AuthTextField, toastFirstError } from "./fields";

interface AuthResponse {
  code?: string;
  message?: string;
}

const sanitizeRedirect = (raw: string): string =>
  raw.startsWith("/") && !raw.startsWith("//") && !raw.startsWith("/\\") ? raw : "/";

export const LoginForm = ({ config }: { config: AuthRoleConfig }) => {
  const searchParams = useSearchParams();
  const redirectTo = config.useRedirectParam
    ? sanitizeRedirect(searchParams.get("redirect") || config.loginRedirect)
    : config.loginRedirect;

  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const goForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    const typed = (watch("email") || (document.getElementById("email") as HTMLInputElement | null)?.value || "").trim();
    window.location.href = typed
      ? `${config.basePath}/forgot-password?email=${encodeURIComponent(typed)}&autoSend=true`
      : `${config.basePath}/forgot-password`;
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${config.apiPrefix}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          rememberPassword: data.rememberPassword ?? false,
        }),
      });
      const resData: AuthResponse = await res.json();
      if (resData.code === "success") {
        toast.success(resData.message);
        window.location.href = redirectTo;
        return;
      }
      toast.error(resData.message || "Something went wrong. Please try again.");
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <form className="grid grid-cols-1 gap-y-[15px] gap-x-[20px]" onSubmit={handleSubmit(onSubmit, toastFirstError(toast.error))}>
      <AuthTextField id="email" label="Email" type="email" autoComplete="email" error={errors.email} registration={register("email")} />
      <AuthPasswordField id="password" label="Password" autoComplete="current-password" error={errors.password} registration={register("password")} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-[8px]">
          <input type="checkbox" id="rememberPassword" className="w-[16px] h-[16px] cursor-pointer" {...register("rememberPassword")} />
          <label htmlFor="rememberPassword" className="font-[500] text-[14px] text-black cursor-pointer">Remember me</label>
        </div>
        <Link href={`${config.basePath}/forgot-password`} onClick={goForgotPassword} className="font-[500] text-[14px] text-[#0088FF] hover:underline">
          Forgot Password?
        </Link>
      </div>

      <AuthSubmitButton disabled={isSubmitting}>Login</AuthSubmitButton>
    </form>
  );
};
