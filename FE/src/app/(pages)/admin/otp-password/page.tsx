import { Metadata } from "next";
import { OtpPasswordForm } from "./OtpPasswordForm";

export const metadata: Metadata = { title: "Admin OTP Verification" };

export default function AdminOtpPasswordPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA] flex items-center justify-center py-[60px]">
      <div className="w-full max-w-[440px] px-[20px]">
        <div className="bg-white rounded-[12px] p-[40px] shadow-lg">
          <h1 className="font-[700] text-[24px] text-[#121212] mb-[8px] text-center">Enter OTP</h1>
          <p className="font-[400] text-[14px] text-[#666] mb-[30px] text-center">
            Please enter the OTP sent to your email
          </p>
          <OtpPasswordForm />
        </div>
      </div>
    </div>
  );
}
