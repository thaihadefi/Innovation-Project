import { Metadata } from "next";
import { cookies } from "next/headers";
import { AuditLogsClient } from "./AuditLogsClient";
import { getAdminPermissions, hasPermission } from "../helpers";
import { NoPermission } from "../NoPermission";

export const metadata: Metadata = { title: "Admin - Audit Logs" };

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> };

export default async function AdminAuditLogsPage({ searchParams }: PageProps) {
  const permissions = await getAdminPermissions();
  if (!hasPermission(permissions, "audit_logs_view")) {
    return <NoPermission />;
  }

  const params = await searchParams;
  const page        = params.page        || "1";
  const actorEmail  = params.actorEmail  || "";
  const action      = params.action      || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let logs: any[] = [];
  let pagination: any = null;

  try {
    const qs = new URLSearchParams({ page });
    if (actorEmail) qs.set("actorEmail", actorEmail);
    if (action)     qs.set("action", action);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/audit-logs?${qs.toString()}`, {
      headers: { Cookie: cookieString }, credentials: "include", cache: "no-store",
    });
    const data = await res.json();
    if (data.code === "success") {
      logs       = data.logs       || [];
      pagination = data.pagination || null;
    }
  } catch {
    // silently fail
  }

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Audit Logs</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">
          Immutable record of sensitive admin actions · auto-purged after 90 days
        </p>
      </div>
      <AuditLogsClient logs={logs} pagination={pagination} />
    </div>
  );
}
