import { Metadata } from "next";
import { cookies } from "next/headers";
import { ReportsAdminClient } from "./ReportsAdminClient";

export const metadata: Metadata = { title: "Reports – Admin" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminReportsPage({ searchParams }: Props) {
  const params = await searchParams;
  const status = String(params.status || "");
  const targetType = String(params.targetType || "");
  const page = String(params.page || "1");

  const API_URL = process.env.API_URL || "http://localhost:4001";
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (targetType) qs.set("targetType", targetType);
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
    <ReportsAdminClient
      initialReports={reports}
      initialPagination={pagination}
      statusFilter={status}
      targetTypeFilter={targetType}
    />
  );
}
