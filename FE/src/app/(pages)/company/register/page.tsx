import { RegisterForm } from "./RegisterForm";

export default function Page() {
  return (
    <>
      {/* Register (Employer) */}
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] px-[20px] py-[50px] max-w-[602px] mx-auto">
            <h2 className="font-[700] text-[20px] text-black mb-[20px] text-center">
              Register (Employer)
            </h2>
            <RegisterForm />
          </div>
        </div>
      </div>
      {/* End Register (Employer) */}
    </>
  )
}