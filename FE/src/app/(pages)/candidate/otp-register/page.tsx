import { OtpRegisterForm } from "./OtpRegisterForm";

export default function OtpRegisterPage() {
  return (
    <>
      <section className="pt-[40px] pb-[40px]">
        <div className="container">
          <div className="w-[400px] mx-auto bg-white rounded-[8px] p-[40px] shadow-[5px_5px_20px_#00000017]">
            <div className="font-[700] text-[24px] text-[#0088FF] text-center mb-[20px]">
              Verify Your Email
            </div>
            <OtpRegisterForm />
          </div>
        </div>
      </section>
    </>
  );
}
