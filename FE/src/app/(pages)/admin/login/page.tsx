import { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin Login" };

export default function AdminLoginPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center py-[60px]">
      <div className="w-full max-w-[440px] px-[20px]">
        <div className="bg-white rounded-[12px] p-[40px] shadow-lg">
          <h1 className="font-[700] text-[24px] text-[#121212] mb-[8px] text-center">Admin Login</h1>
          <p className="font-[400] text-[14px] text-[#666] mb-[30px] text-center">Sign in to the admin panel</p>
          <LoginForm />
        </div>
        <p className="text-center text-[14px] text-[#666] mt-[20px]">
          Don&apos;t have an account?{" "}
          <Link href="/admin/register" className="text-[#0088FF] hover:underline font-[500]">Register</Link>
        </p>
      </div>
    </div>
  );
}
