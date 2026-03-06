import { Metadata } from "next";
import { cookies } from "next/headers";
import { JobsClient } from "./JobsClient";

export const metadata: Metadata = { title: "Admin - Jobs" };

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> };

export default async function AdminJobsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page || "1";
  const keyword = params.keyword || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let jobs: any[] = [];
  let pagination: any = null;

  try {
    const qs = new URLSearchParams({ page });
    if (keyword) qs.set("keyword", keyword);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/jobs?${qs.toString()}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.code === "success") {
      jobs = data.jobs || [];
      pagination = data.pagination || null;
    }
  } catch {
    // silently fail
  }

  return (
    <div className="py-[40px]">
      <div className="container">
        <h1 className="font-[700] text-[24px] text-[#121212] mb-[24px]">Jobs</h1>
        <JobsClient initialJobs={jobs} initialPagination={pagination} />
      </div>
    </div>
  );
}
