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
    <header className="h-[56px] bg-white border-b border-[#E8E8E8] flex items-center justify-between px-[24px] shrink-0">
      <Link href="/admin-manage/dashboard" className="font-[800] text-[18px] text-[#000071]">
        UITJobs
      </Link>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen(!open)}
          className="flex items-center gap-[8px] px-[12px] py-[6px] rounded-[8px] hover:bg-[#F5F7FA] transition-all cursor-pointer"
        >
          <div className="w-[32px] h-[32px] rounded-full overflow-hidden shrink-0">
            {adminAvatar ? (
              <img src={adminAvatar} alt={adminName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#EEF6FF] flex items-center justify-center text-[12px] font-[700] text-[#0088FF]">
                {initials}
              </div>
            )}
          </div>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-[13px] font-[600] text-[#121212] max-w-[140px] truncate leading-tight">
              {adminName || adminEmail}
            </span>
            <span className="text-[11px] text-[#999] max-w-[140px] truncate leading-tight">
              {adminEmail}
            </span>
          </div>
          <FaChevronDown className={`text-[10px] text-[#999] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </button>
        {open && (
          <div className="absolute right-0 top-[calc(100%+4px)] w-[210px] bg-white rounded-[8px] shadow-lg border border-[#E8E8E8] py-[4px] z-50">
            <Link
              href="/admin-manage/profile"
              onClick={() => setOpen(false)}
              className="w-full flex items-center gap-[8px] px-[16px] py-[10px] text-[14px] text-[#333] hover:bg-[#F5F7FA] transition-all cursor-pointer"
            >
              <FaUser className="text-[13px] text-[#999]" />
              Personal Information
            </Link>
            <div className="border-t border-[#F0F0F0] my-[2px]" />
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-[8px] px-[16px] py-[10px] text-[14px] text-[#666] hover:bg-red-50 hover:text-red-500 transition-all cursor-pointer"
            >
              <FaSignOutAlt className="text-[13px]" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
