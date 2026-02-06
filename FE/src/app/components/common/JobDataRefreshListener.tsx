"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

const MUTATION_KEY = "job_data_mutated_at";
const APPLIED_KEY = "job_data_refresh_applied_at";

const shouldRefreshPath = (pathname: string) => {
  if (pathname === "/") return true;
  if (pathname === "/search") return true;
  if (pathname === "/company/list") return true;
  if (pathname.startsWith("/company/detail/")) return true;
  return false;
};

export const JobDataRefreshListener = () => {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const maybeRefresh = () => {
      if (!shouldRefreshPath(pathname)) return;

      const mutatedAt = Number(localStorage.getItem(MUTATION_KEY) || 0);
      const appliedAt = Number(sessionStorage.getItem(APPLIED_KEY) || 0);
      if (!mutatedAt || mutatedAt <= appliedAt) return;

      sessionStorage.setItem(APPLIED_KEY, String(mutatedAt));
      router.refresh();
    };

    maybeRefresh();
    window.addEventListener("focus", maybeRefresh);
    window.addEventListener("pageshow", maybeRefresh);
    window.addEventListener("storage", maybeRefresh);

    return () => {
      window.removeEventListener("focus", maybeRefresh);
      window.removeEventListener("pageshow", maybeRefresh);
      window.removeEventListener("storage", maybeRefresh);
    };
  }, [pathname, router]);

  return null;
};

