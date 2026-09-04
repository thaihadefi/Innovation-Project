import { Metadata } from "next";
import { cookies } from "next/headers";
import { JobsClient, type Job } from "./JobsClient";
import type { PaginationMeta } from "@/types/pagination";
import { getAdminPermissions, hasPermission, getServerApiUrl } from "../helpers";
import { NoPermission } from "../NoPermission";

export const metadata: Metadata = { title: "Admin - Jobs" };

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> };

export default async function AdminJobsPage({ searchParams }: PageProps) {
  const permissions = await getAdminPermissions();
  if (!hasPermission(permissions, "jobs_view")) {
    return <NoPermission />;
  }

  const params = await searchParams;
  const page = params.page || "1";
  const keyword = params.keyword || "";
  const status = params.status || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let jobs: Job[] = [];
  let pagination: PaginationMeta | null = null;

  try {
    const qs = new URLSearchParams({ page });
    if (keyword) qs.set("keyword", keyword);
    if (status) qs.set("status", status);

    const res = await fetch(getServerApiUrl(`/admin/jobs?${qs.toString()}`), {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = (await res.json()) as { code?: string; jobs?: Job[]; pagination?: PaginationMeta };
    if (data.code === "success") {
      jobs = data.jobs || [];
      pagination = data.pagination || null;
    }
  } catch { /* keep fallback values on error */ }

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Jobs</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Monitor and moderate all job listings</p>
      </div>
      <JobsClient initialJobs={jobs} initialPagination={pagination} />
    </div>
  );
}
