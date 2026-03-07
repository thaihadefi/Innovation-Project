import Link from "next/link";
import { FaLock, FaArrowLeft } from "react-icons/fa";

export function NoPermission() {
  return (
    <div className="py-[40px] px-[32px]">
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm py-[80px] text-center max-w-[480px] mx-auto">
        {/* Icon */}
        <div className="relative w-[72px] h-[72px] mx-auto mb-[20px]">
          <div className="absolute inset-0 rounded-full bg-red-50 border border-red-100" />
          <div className="absolute inset-[6px] rounded-full bg-red-100 flex items-center justify-center">
            <FaLock className="text-[22px] text-red-500" />
          </div>
        </div>

        {/* Text */}
        <h2 className="text-[20px] font-[700] text-[#111827] mb-[8px]">Access Denied</h2>
        <p className="text-[14px] text-[#6B7280] max-w-[320px] mx-auto leading-relaxed">
          You do not have permission to access this section. Contact a superadmin if you need access.
        </p>

        {/* Divider */}
        <div className="w-[40px] h-[2px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-full mx-auto my-[24px]" />

        {/* Back link */}
        <Link
          href="/admin-manage/dashboard"
          className="inline-flex items-center gap-[8px] px-[20px] h-[40px] rounded-[8px] border border-[#E5E7EB] text-[14px] text-[#6B7280] hover:border-[#0088FF] hover:text-[#0088FF] transition-all font-[500]"
        >
          <FaArrowLeft className="text-[11px]" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
