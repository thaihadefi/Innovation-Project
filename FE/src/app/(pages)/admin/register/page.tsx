import { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Admin Register" };

export default function AdminRegisterPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center py-[60px]">
      <div className="w-full max-w-[440px] px-[20px]">
        <div className="bg-white rounded-[12px] p-[40px] shadow-lg">
          <h1 className="font-[700] text-[24px] text-[#121212] mb-[8px] text-center">Admin Register</h1>
          <p className="font-[400] text-[14px] text-[#666] mb-[30px] text-center">Create an admin account</p>
          <RegisterForm />
        </div>
        <p className="text-center text-[14px] text-[#666] mt-[20px]">
          Already have an account?{" "}
          <Link href="/admin/login" className="text-[#0088FF] hover:underline font-[500]">Login</Link>
        </p>
      </div>
    </div>
  );
}
