"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { interviewTipsSections } from "./interviewTipsConfig";

const searchIndex = [
  { title: "Interview Tips", href: "/interview-tips", section: "Library" },
  ...interviewTipsSections.flatMap((section) => [
    { title: section.title, href: section.href, section: section.badge },
    ...section.children.map((child) => ({
      title: child.title,
      href: child.href,
      section: section.badge,
    })),
  ]),
];

export function InterviewTipsLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);
  const trimmedQuery = query.trim().toLowerCase();
  const results = useMemo(() => {
    if (!trimmedQuery) return [];
    return searchIndex.filter((item) => {
      const haystack = `${item.title} ${item.section}`.toLowerCase();
      return haystack.includes(trimmedQuery);
    });
  }, [trimmedQuery]);

  const currentContext = useMemo(() => {
    for (const section of interviewTipsSections) {
      if (section.href === pathname) {
        return { currentTitle: section.title, backHref: "/interview-tips", backLabel: "All sections" };
      }
      const child = section.children.find((item) => item.href === pathname);
      if (child) {
        return { currentTitle: child.title, backHref: section.href, backLabel: section.title };
      }
    }
    return null;
  }, [pathname]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!trimmedQuery) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((prev) => (prev + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((prev) => (prev <= 0 ? results.length - 1 : prev - 1));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (target) {
        setQuery("");
        setActiveIndex(-1);
        router.push(target.href);
      }
    } else if (event.key === "Escape") {
      setQuery("");
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,#E6F2FF_0%,transparent_40%),radial-gradient(circle_at_85%_20%,#FFF1D6_0%,transparent_45%),linear-gradient(180deg,#F8FAFF_0%,#FFFFFF_40%)]" />
      <div className="absolute -top-[120px] -right-[120px] h-[260px] w-[260px] rounded-full bg-[#FFE9C7] blur-[40px] opacity-70" />
      <div className="absolute top-[180px] -left-[120px] h-[260px] w-[260px] rounded-full bg-[#CFE8FF] blur-[40px] opacity-70" />

      <div className="relative container py-[24px] sm:py-[48px]">
        <div className="mb-[16px] rounded-[16px] border border-[#E5E7EB] bg-white/90 p-[16px] shadow-sm">
          <label className="text-[12px] font-[700] uppercase tracking-[0.12em] text-[#6B7280]">
            Search Library
          </label>
          <div className="relative mt-[8px]">
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search all topics..."
              className="w-full rounded-[12px] border border-[#E5E7EB] bg-white px-[14px] py-[10px] text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:border-[#93C5FD] focus:outline-none focus:ring-2 focus:ring-[#93C5FD]/30"
            />
            {trimmedQuery && (
              <div className="absolute z-20 mt-[8px] w-full rounded-[12px] border border-[#E5E7EB] bg-white shadow-lg">
                {results.length === 0 ? (
                  <div className="px-[14px] py-[12px] text-[13px] text-[#6B7280]">
                    No results found.
                  </div>
                ) : (
                  <ul className="max-h-[260px] overflow-auto">
                    {results.map((item, index) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center justify-between px-[14px] py-[10px] text-[14px] text-[#111827] ${
                            index === activeIndex ? "bg-[#F3F4F6]" : "hover:bg-[#F3F4F6]"
                          }`}
                          onClick={() => {
                            setQuery("");
                            setActiveIndex(-1);
                          }}
                        >
                          <span>{item.title}</span>
                          <span className="text-[12px] font-[600] text-[#6B7280]">{item.section}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        </div>
        {currentContext && (
          <div className="mb-[12px]">
            <Link
              href={currentContext.backHref}
              className="inline-flex items-center gap-[6px] text-[14px] font-[600] text-[#2563EB] hover:underline"
            >
              ← {currentContext.backLabel}
            </Link>
            <div className="mt-[8px] text-[22px] font-[700] text-[#111827]">
              {currentContext.currentTitle}
            </div>
          </div>
        )}
        <main className="flex flex-col gap-[20px] min-w-0">{children}</main>
      </div>
    </div>
  );
}
