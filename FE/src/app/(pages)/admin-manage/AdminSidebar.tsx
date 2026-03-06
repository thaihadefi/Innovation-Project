"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

const navItems = [
  { href: "/admin-manage/dashboard", label: "Dashboard" },
  { href: "/admin-manage/candidates", label: "Candidates" },
  { href: "/admin-manage/companies", label: "Companies" },
  { href: "/admin-manage/jobs", label: "Jobs" },
  { href: "/admin-manage/roles", label: "Roles" },
  { href: "/admin-manage/accounts", label: "Accounts" },
];

export const AdminSidebar = () => {
  const pathname = usePathname();
  const router = useRouter();

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

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-[#DEDEDE] flex flex-col shrink-0">
      <div className="px-[20px] py-[24px] border-b border-[#DEDEDE]">
        <h2 className="font-[700] text-[16px] text-[#121212]">Admin Panel</h2>
        <p className="text-[12px] text-[#999] mt-[2px]">Management System</p>
      </div>
      <nav className="flex-1 px-[12px] py-[16px] flex flex-col gap-[4px]">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link key={item.href} href={item.href}
              className={`px-[12px] py-[10px] rounded-[8px] font-[500] text-[14px] transition-all duration-150 ${
                isActive
                  ? "bg-[#EEF6FF] text-[#0088FF]"
                  : "text-[#666] hover:bg-[#F5F7FA] hover:text-[#121212]"
              }`}>
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-[12px] py-[16px] border-t border-[#DEDEDE]">
        <button onClick={handleLogout}
          className="w-full px-[12px] py-[10px] rounded-[8px] text-[14px] font-[500] text-[#666] hover:bg-red-50 hover:text-red-500 transition-all duration-150 text-left cursor-pointer">
          Logout
        </button>
      </div>
    </aside>
  );
};
