"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { FaChevronDown, FaSignOutAlt, FaUser } from "react-icons/fa";

type AdminHeaderProps = {
  adminName: string;
  adminEmail: string;
  adminAvatar?: string | null;
};

export const AdminHeader = ({ adminName, adminEmail, adminAvatar }: AdminHeaderProps) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
      router.push("/admin/login");
    } catch {
      toast.error("Logout failed. Please try again.");
    }
  };

  const initials = adminName
    ? adminName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase()
    : "A";

  return (
    <header className="h-[56px] bg-white border-b border-[#EBEBEB] flex items-center justify-between px-[24px] shrink-0">
      {/* Left: subtle tagline */}
      <div className="hidden sm:flex items-center gap-[8px]">
        <div className="w-[6px] h-[6px] rounded-full bg-gradient-to-br from-[#0088FF] to-[#0055CC]" />
        <span className="text-[12px] font-[500] text-[#9BAAB8] tracking-[0.2px]">Management Console</span>
      </div>

      {/* Right: user dropdown */}
      <div className="relative ml-auto" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-[8px] px-[10px] py-[5px] rounded-[8px] hover:bg-[#F5F7FA] transition-all cursor-pointer border border-transparent hover:border-[#EBEBEB]"
        >
          <div className="w-[30px] h-[30px] rounded-full overflow-hidden shrink-0 ring-[1.5px] ring-[#E5E7EB]">
            {adminAvatar ? (
              <img src={adminAvatar} alt={adminName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[#EEF6FF] to-[#DBEAFE] flex items-center justify-center text-[11px] font-[700] text-[#0088FF]">
                {initials}
              </div>
            )}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-[13px] font-[600] text-[#111827] max-w-[140px] truncate leading-tight">
              {adminName || adminEmail}
            </span>
            <span className="text-[11px] text-[#9CA3AF] max-w-[140px] truncate leading-tight">
              {adminEmail}
            </span>
          </div>
          <FaChevronDown className={`text-[10px] text-[#9CA3AF] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-[210px] bg-white rounded-[10px] shadow-[0_8px_24px_rgba(0,0,0,0.10)] border border-[#E8E8E8] py-[4px] z-50">
            {/* User info header in dropdown */}
            <div className="px-[14px] py-[10px] border-b border-[#F5F5F5]">
              <p className="text-[13px] font-[600] text-[#111827] truncate">{adminName}</p>
              <p className="text-[11px] text-[#9CA3AF] truncate mt-[1px]">{adminEmail}</p>
            </div>
            <div className="py-[4px]">
              <Link
                href="/admin-manage/profile"
                onClick={() => setOpen(false)}
                className="w-full flex items-center gap-[8px] px-[14px] py-[9px] text-[13px] text-[#374151] hover:bg-[#F5F7FA] transition-all cursor-pointer"
              >
                <FaUser className="text-[12px] text-[#9CA3AF]" />
                Personal Information
              </Link>
              <div className="border-t border-[#F5F5F5] my-[2px]" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-[8px] px-[14px] py-[9px] text-[13px] text-[#6B7280] hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
              >
                <FaSignOutAlt className="text-[12px]" />
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
