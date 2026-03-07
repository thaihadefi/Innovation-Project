import { Metadata } from "next";
import { cookies } from "next/headers";
import { ReportsAdminClient } from "./ReportsAdminClient";

export const metadata: Metadata = { title: "Reports – Admin" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = String(params.status || "");
  const targetType = String(params.targetType || "");
  const keyword = String(params.keyword || "");
  const page = String(params.page || "1");

  const API_URL = process.env.API_URL || "http://localhost:4001";
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (targetType) qs.set("targetType", targetType);
  if (keyword) qs.set("keyword", keyword);
  qs.set("page", page);

  const data = await fetch(`${API_URL}/admin/reports?${qs.toString()}`, {
    headers: { Cookie: cookieString },
    cache: "no-store",
  })
    .then((r) => r.json())
    .catch(() => ({ code: "error" }));

  const reports = data.code === "success" ? (data.reports || []) : [];
  const pagination = data.code === "success" ? data.pagination : null;

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Reports</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">User-submitted reports on reviews and comments</p>
      </div>
      <ReportsAdminClient
        initialReports={reports}
        initialPagination={pagination}
        statusFilter={status}
        targetTypeFilter={targetType}
        keywordFilter={keyword}
      />
    </div>
  );
}
