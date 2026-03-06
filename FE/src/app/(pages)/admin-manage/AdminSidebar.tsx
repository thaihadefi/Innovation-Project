"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaTachometerAlt,
  FaUserGraduate,
  FaBuilding,
  FaBriefcase,
  FaShieldAlt,
  FaUserShield,
} from "react-icons/fa";

const navItems = [
  { href: "/admin-manage/dashboard", label: "Dashboard", icon: FaTachometerAlt, permission: null },
  { href: "/admin-manage/candidates", label: "Candidates", icon: FaUserGraduate, permission: "candidates_view" },
  { href: "/admin-manage/companies", label: "Companies", icon: FaBuilding, permission: "companies_view" },
  { href: "/admin-manage/jobs", label: "Jobs", icon: FaBriefcase, permission: "jobs_view" },
  { href: "/admin-manage/roles", label: "Roles", icon: FaShieldAlt, permission: "roles_view" },
  { href: "/admin-manage/accounts", label: "Accounts", icon: FaUserShield, permission: "accounts_view" },
];

interface AdminSidebarProps {
  permissions: string[] | null; // null = superadmin (full access)
}

export const AdminSidebar = ({ permissions }: AdminSidebarProps) => {
  const pathname = usePathname();

  const hasAccess = (permission: string | null) => {
    if (permission === null) return true; // dashboard — always accessible
    if (permissions === null) return true; // superadmin
    return permissions.includes(permission);
  };

  return (
    <aside className="w-[220px] min-h-screen bg-white border-r border-[#E8E8E8] flex flex-col shrink-0">
      <div className="px-[20px] py-[18px] border-b border-[#E8E8E8]">
        <p className="font-[700] text-[10px] text-[#B0B8C8] uppercase tracking-[1.2px]">Admin Panel</p>
      </div>
      <nav className="flex-1 px-[10px] py-[14px] flex flex-col gap-[2px]">
        {navItems.map(({ href, label, icon: Icon, permission }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const accessible = hasAccess(permission);
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-[10px] px-[12px] py-[9px] rounded-[8px] font-[500] text-[13.5px] transition-all duration-150 ${
                !accessible
                  ? "text-[#C8CDD5] cursor-default"
                  : isActive
                  ? "bg-[#EEF6FF] text-[#0088FF]"
                  : "text-[#5A6478] hover:bg-[#F5F7FA] hover:text-[#121212]"
              }`}
            >
              <Icon className={`text-[13px] shrink-0 ${
                !accessible
                  ? "text-[#D4D8E0]"
                  : isActive ? "text-[#0088FF]" : "text-[#9BAAB8]"
              }`} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
