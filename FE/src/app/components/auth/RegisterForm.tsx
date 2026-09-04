"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useForm, type FieldValues, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { companyRegisterSchema, registerSchema } from "@/schemas/auth.schema";
import type { AuthRoleConfig } from "@/configs/auth";
import { AuthPasswordField, AuthSubmitButton, AuthTextField, toastFirstError } from "./fields";

interface AuthResponse {
  code?: string;
  message?: string;
}

export const RegisterForm = ({ config }: { config: AuthRoleConfig }) => {
  const router = useRouter();
  const isCompany = config.registerKind === "company";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FieldValues>({
    // Two shapes (fullName vs companyName) share this one form; fields are read dynamically.
    resolver: zodResolver(isCompany ? companyRegisterSchema : registerSchema) as unknown as Resolver<FieldValues>,
  });

  const onSubmit = async (data: FieldValues) => {
    try {
      const payload = isCompany
        ? { companyName: data.companyName, email: data.email, password: data.password }
        : { fullName: data.fullName, email: data.email, password: data.password };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${config.apiPrefix}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const resData: AuthResponse = await res.json();
      if (resData.code === "success") {
        toast.success(resData.message);
        router.push(`${config.basePath}/login`);
        return;
      }
      toast.error(resData.message || "Something went wrong. Please try again.");
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <form className="grid grid-cols-1 gap-y-[15px] gap-x-[20px]" onSubmit={handleSubmit(onSubmit, toastFirstError(toast.error))}>
      {isCompany ? (
        <AuthTextField id="companyName" label="Company Name" autoComplete="organization" error={errors.companyName} registration={register("companyName")} />
      ) : (
        <AuthTextField id="fullName" label="Full Name" autoComplete="name" error={errors.fullName} registration={register("fullName")} />
      )}
      <AuthTextField id="email" label="Email" type="email" autoComplete="email" error={errors.email} registration={register("email")} />
      <AuthPasswordField id="password" label="Password" autoComplete="new-password" error={errors.password} registration={register("password")} />
      <AuthPasswordField id="confirmPassword" label="Confirm Password" autoComplete="new-password" error={errors.confirmPassword} registration={register("confirmPassword")} />
      <AuthSubmitButton disabled={isSubmitting}>Register</AuthSubmitButton>
    </form>
  );
};
