import { ProfileForm } from "./ProfileForm";

export default function CompanyManagerProfilePage() {
  return (
    <>
      {/* Company Information */}
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
            <h2 className="font-[700] text-[20px] text-black mb-[20px]">
              Company Information
            </h2>
            <ProfileForm />
          </div>
        </div>
      </div>
      {/* End Company Information */}
    </>
  )
}