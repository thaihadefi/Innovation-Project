import { FaLock } from "react-icons/fa";

export function NoPermission() {
  return (
    <div className="py-[40px] px-[32px]">
      <div className="bg-white rounded-[12px] border border-[#E8E8E8] py-[80px] text-center">
        <div className="w-[56px] h-[56px] rounded-full bg-[#FEF2F2] flex items-center justify-center mx-auto mb-[16px]">
          <FaLock className="text-[20px] text-[#EF4444]" />
        </div>
        <h2 className="text-[18px] font-[600] text-[#111827] mb-[6px]">Access Denied</h2>
        <p className="text-[14px] text-[#6B7280] max-w-[380px] mx-auto">
          You do not have permission to access this section. Please contact a superadmin if you need access.
        </p>
      </div>
    </div>
  );
}
