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
  FaComments,
  FaStar,
  FaFlag,
} from "react-icons/fa";

const navItems = [
  { href: "/admin-manage/dashboard", label: "Dashboard", icon: FaTachometerAlt, permission: null },
  { href: "/admin-manage/candidates", label: "Candidates", icon: FaUserGraduate, permission: "candidates_view" },
  { href: "/admin-manage/companies", label: "Companies", icon: FaBuilding, permission: "companies_view" },
  { href: "/admin-manage/jobs", label: "Jobs", icon: FaBriefcase, permission: "jobs_view" },
  { href: "/admin-manage/roles", label: "Roles", icon: FaShieldAlt, permission: "roles_view" },
  { href: "/admin-manage/accounts", label: "Accounts", icon: FaUserShield, permission: "accounts_view" },
  { href: "/admin-manage/interview-experiences", label: "Experiences", icon: FaComments, permission: "experiences_view" },
  { href: "/admin-manage/reviews", label: "Reviews", icon: FaStar, permission: "reviews_view" },
  { href: "/admin-manage/reports", label: "Reports", icon: FaFlag, permission: "reports_view" },
];

interface AdminSidebarProps {
  permissions: string[] | null; // null = superadmin (full access)
}

export const AdminSidebar = ({ permissions }: AdminSidebarProps) => {
  const pathname = usePathname();

  const hasAccess = (permission: string | null) => {
    if (permission === null) return true;
    if (permissions === null) return true;
    return permissions.includes(permission);
  };

  return (
    <aside className="w-[228px] min-h-screen bg-white border-r border-[#EBEBEB] flex flex-col shrink-0">
      {/* Brand */}
      <div className="h-[56px] px-[20px] flex items-center border-b border-[#EBEBEB]">
        <Link href="/admin-manage/dashboard" className="flex items-center gap-[10px] group">
          <div className="w-[32px] h-[32px] rounded-[8px] bg-gradient-to-br from-[#0088FF] to-[#0055CC] flex items-center justify-center shrink-0 shadow-sm">
            <svg className="w-[16px] h-[16px] text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <p className="font-[800] text-[15px] text-[#000071] leading-none">UITJobs</p>
            <p className="text-[10px] text-[#9BAAB8] font-[500] leading-none mt-[2px]">Admin Console</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-[10px] py-[12px] flex flex-col gap-[2px]">
        <p className="px-[12px] mb-[6px] text-[10px] font-[600] text-[#B8C4D0] uppercase tracking-[1px]">Navigation</p>
        {navItems.map(({ href, label, icon: Icon, permission }) => {
          const isActive = pathname === href || pathname.startsWith(href + "/");
          const accessible = hasAccess(permission);
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex items-center gap-[10px] px-[12px] py-[9px] rounded-[8px] font-[500] text-[13.5px] transition-all duration-150 ${
                !accessible
                  ? "text-[#C8CDD5] cursor-default pointer-events-none"
                  : isActive
                  ? "bg-[#EEF6FF] text-[#0088FF]"
                  : "text-[#5A6478] hover:bg-[#F5F7FA] hover:text-[#111827]"
              }`}
            >
              {/* Active left accent bar */}
              {isActive && accessible && (
                <span className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-full bg-gradient-to-b from-[#0088FF] to-[#0066CC]" />
              )}
              <Icon className={`text-[14px] shrink-0 ${
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
