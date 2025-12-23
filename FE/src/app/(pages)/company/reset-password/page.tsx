import { Metadata } from "next";
import { ResetPasswordForm } from "./ResetPasswordForm";

export const metadata: Metadata = {
  title: "Reset Password (Employer)",
};

export default function ResetPasswordPage() {
  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <div className="max-w-[500px] mx-auto bg-white rounded-[8px] p-[30px] shadow-lg">
            <h1 className="font-[700] text-[24px] text-[#121212] mb-[10px] text-center">
              Reset Password
            </h1>
            <p className="font-[400] text-[14px] text-[#666] mb-[30px] text-center">
              Please enter your new password
            </p>
            <ResetPasswordForm />
          </div>
        </div>
      </div>
    </>
  );
}
