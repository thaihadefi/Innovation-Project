"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
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
  FaBars,
  FaTimes,
} from "react-icons/fa";

const navItems = [
  { href: "/admin-manage/dashboard", label: "Dashboard", icon: FaTachometerAlt, permission: null },
  { href: "/admin-manage/candidates", label: "Candidates", icon: FaUserGraduate, permission: "candidates_view" },
  { href: "/admin-manage/companies", label: "Companies", icon: FaBuilding, permission: "companies_view" },
  { href: "/admin-manage/jobs", label: "Jobs", icon: FaBriefcase, permission: "jobs_view" },
  { href: "/admin-manage/roles", label: "Roles", icon: FaShieldAlt, permission: "roles_view" },
  { href: "/admin-manage/accounts", label: "Accounts", icon: FaUserShield, permission: "accounts_view" },
  { href: "/admin-manage/interview-experiences", label: "Experiences", icon: FaComments, permission: "experiences_view" },
  { href: "/admin-manage/reviews", label: "Reviews", icon: FaStar, permission: "reviews_manage" },
  { href: "/admin-manage/reports", label: "Reports", icon: FaFlag, permission: "reports_view" },
];

interface AdminSidebarProps {
  permissions: string[] | null; // null = superadmin (full access)
}

export const AdminSidebar = ({ permissions }: AdminSidebarProps) => {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const hasAccess = (permission: string | null) => {
    if (permission === null) return true;
    if (permissions === null) return true;
    return permissions.includes(permission);
  };

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const sidebarContent = (
    <>
      {/* Brand */}
      <div className="h-[56px] px-[20px] flex items-center justify-between border-b border-[#EBEBEB]">
        <Link href="/admin-manage/dashboard" className="group">
          <p className="font-[800] text-[15px] text-[#000071] leading-none">UITJobs</p>
          <p className="text-[10px] text-[#9BAAB8] font-[500] leading-none mt-[3px]">Admin Console</p>
        </Link>
        {/* Close button for mobile */}
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden w-[32px] h-[32px] rounded-full hover:bg-[#F3F4F6] flex items-center justify-center transition-colors cursor-pointer"
        >
          <FaTimes className="text-[14px] text-[#6B7280]" />
        </button>
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
    </>
  );

  return (
    <>
      {/* Mobile hamburger button - shown in header area on small screens */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-[14px] left-[16px] z-[60] w-[32px] h-[32px] rounded-[8px] bg-white border border-[#EBEBEB] flex items-center justify-center shadow-sm cursor-pointer hover:bg-[#F5F7FA] transition-colors"
        aria-label="Open sidebar"
      >
        <FaBars className="text-[14px] text-[#6B7280]" />
      </button>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[228px] min-h-screen bg-white border-r border-[#EBEBEB] flex-col shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-[70] bg-black/40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={`lg:hidden fixed top-0 left-0 z-[80] w-[260px] h-full bg-white border-r border-[#EBEBEB] flex flex-col transform transition-transform duration-200 ease-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {sidebarContent}
      </aside>
    </>
  );
};
