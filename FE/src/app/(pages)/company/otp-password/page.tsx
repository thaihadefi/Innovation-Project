import { Metadata } from "next";
import { OtpPasswordForm } from "./OtpPasswordForm";

export const metadata: Metadata = {
  title: "Enter OTP (Employer)",
};

export default function OtpPasswordPage() {
  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <div className="max-w-[500px] mx-auto bg-white rounded-[8px] p-[30px] shadow-lg">
            <h1 className="font-[700] text-[24px] text-[#121212] mb-[10px] text-center">
              Enter OTP
            </h1>
            <p className="font-[400] text-[14px] text-[#666] mb-[30px] text-center">
              Please enter the OTP sent to your email
            </p>
            <OtpPasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}
