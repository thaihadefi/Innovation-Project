import { ProfileForm } from "./ProfileForm";

export default function Page() {
  return (
    <>
      {/* Personal Information */}
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <h1 className="font-[700] text-[20px] text-black mb-[20px]">
              Personal Information
            </h1>
            <ProfileForm />
          </div>
        </div>
      </div>
      {/* End Personal Information */}
    </>
  )
}