import { LoginForm } from "@/app/components/auth/LoginForm";
import { AUTH_CONFIG } from "@/configs/auth";

export default function Page() {
  return (
    <>
      
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] px-[20px] py-[50px] max-w-[602px] mx-auto">
            <h2 className="font-[700] text-[20px] text-black mb-[20px] text-center">
              Login (Candidate)
            </h2>
            <LoginForm config={AUTH_CONFIG.candidate} />
          </div>
        </div>
      </div>
      
    </>
  )
}