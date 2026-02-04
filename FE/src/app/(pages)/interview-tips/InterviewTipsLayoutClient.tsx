"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBookOpen, FaLayerGroup, FaCode, FaListCheck } from "react-icons/fa6";

const navTree = [
  {
    label: "Interview Tips",
    href: "/interview-tips",
    children: [
      {
        label: "Data Structures and Algorithms",
        href: "/interview-tips/dsa",
        children: [
          {
            label: "Code templates",
            href: "/interview-tips/dsa/code-templates",
          },
          {
            label: "Stages of an interview",
            href: "/interview-tips/dsa/stages-of-an-interview",
          },
          {
            label: "Cheatsheets",
            href: "/interview-tips/dsa/cheatsheets",
          },
        ],
      },
    ],
  },
];

const iconMap: Record<string, React.ReactNode> = {
  "/interview-tips": <FaBookOpen />,
  "/interview-tips/dsa": <FaLayerGroup />,
  "/interview-tips/dsa/code-templates": <FaCode />,
  "/interview-tips/dsa/stages-of-an-interview": <FaListCheck />,
  "/interview-tips/dsa/cheatsheets": <FaBookOpen />,
};

function NavLink({ href, label, level = 0 }: { href: string; label: string; level?: number }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`flex items-center gap-[8px] rounded-[10px] px-[12px] py-[8px] text-[14px] transition-colors duration-200 cursor-pointer ${
        isActive
          ? "bg-[#111827] text-white"
          : "text-[#4B5563] hover:bg-[#F3F4F6]"
      } ${level === 2 ? "ml-[16px]" : level === 1 ? "ml-[8px]" : ""}`}
    >
      <span className={`text-[13px] ${isActive ? "text-white" : "text-[#9CA3AF]"}`}>
        {iconMap[href] || <FaBookOpen />}
      </span>
      {label}
    </Link>
  );
}

export function InterviewTipsLayoutClient({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,#E6F2FF_0%,transparent_40%),radial-gradient(circle_at_85%_20%,#FFF1D6_0%,transparent_45%),linear-gradient(180deg,#F8FAFF_0%,#FFFFFF_40%)]" />
      <div className="absolute -top-[120px] -right-[120px] h-[260px] w-[260px] rounded-full bg-[#FFE9C7] blur-[40px] opacity-70" />
      <div className="absolute top-[180px] -left-[120px] h-[260px] w-[260px] rounded-full bg-[#CFE8FF] blur-[40px] opacity-70" />

      <div className="relative container py-[48px]">
        <div className="grid gap-[24px] lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-[20px] h-fit rounded-[16px] border border-[#E5E7EB] bg-white/90 p-[16px] shadow-sm">
            <div className="text-[12px] font-[700] uppercase tracking-[0.12em] text-[#6B7280] mb-[10px]">
              Library
            </div>
            <nav className="flex flex-col gap-[8px]">
              {navTree.map((root) => (
                <div key={root.href} className="flex flex-col gap-[6px]">
                  <NavLink href={root.href} label={root.label} level={0} />
                  {root.children?.map((child) => (
                    <div key={child.href} className="flex flex-col gap-[6px]">
                      <NavLink href={child.href} label={child.label} level={1} />
                      {child.children?.map((leaf) => (
                        <NavLink key={leaf.href} href={leaf.href} label={leaf.label} level={2} />
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </nav>
          </aside>

          <main className="flex flex-col gap-[20px]">{children}</main>
        </div>
      </div>
    </div>
  );
}
