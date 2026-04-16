"use client";
import { useRouter, useSearchParams } from "next/navigation";

const TARGET_TYPE_LABELS: Record<string, string> = {
  AccountCandidate:    "Candidate",
  AccountCompany:      "Company",
  AccountAdmin:        "Admin",
  Job:                 "Job",
  Role:                "Role",
  InterviewExperience: "Experience",
  ExperienceComment:   "Comment",
  Review:              "Review",
  Report:              "Report",
};

/** Extract a human-readable identifier from the detail snapshot (email, name, etc.) */
const extractTargetLabel = (detail: Record<string, unknown> | null): string | null => {
  if (!detail) return null;
  if (typeof detail.email === "string") return detail.email;
  if (typeof detail.companyName === "string") return detail.companyName;
  if (typeof detail.name === "string") return detail.name;
  if (typeof detail.title === "string") return detail.title;
  if (typeof detail.reason === "string") return `Reason: ${detail.reason}`;
  if (typeof detail.targetType === "string") return `On: ${detail.targetType}`;
  if (typeof detail.newRoleId === "string") return `→ role ${detail.newRoleId.slice(-6)}`;
  if (typeof detail.experienceId === "string") return `Post: ${detail.experienceId.slice(-6)}`;
  return null;
};

type AuditLog = {
  _id: string;
  actorId: string;
  actorEmail: string;
  action: string;
  targetId: string | null;
  targetType: string | null;
  detail: Record<string, unknown> | null;
  createdAt: string;
};

type Pagination = { totalRecord: number; totalPage: number; currentPage: number; pageSize: number };

export const AuditLogsClient = ({
  logs,
  pagination,
}: {
  logs: AuditLog[];
  pagination: Pagination | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const actorEmail = searchParams.get("actorEmail") || "";
  const action     = searchParams.get("action")     || "";
  const page       = searchParams.get("page")        || "1";

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete("page");
    router.push(`/admin-manage/audit-logs?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/audit-logs?${params.toString()}`);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <input
          type="text"
          placeholder="Filter by email..."
          defaultValue={actorEmail}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ actorEmail: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-full sm:w-[240px] focus:border-[#0088FF] outline-none bg-white placeholder:text-[#C4C9D4]"
        />
        <input
          type="text"
          placeholder="Filter by action (e.g. account.create)..."
          defaultValue={action}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ action: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-full sm:w-[280px] focus:border-[#0088FF] outline-none bg-white placeholder:text-[#C4C9D4]"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[860px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actor</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Action</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Target</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Detail</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Time</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-[64px]">
                    <div className="flex flex-col items-center gap-[10px] text-[#9CA3AF]">
                      <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center">
                        <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-[500] text-[#374151]">No audit logs found</p>
                        <p className="text-[12px] mt-[2px]">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : logs.map((log) => (
                <tr key={log._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-[16px] py-[13px]">
                    <span className="text-[#374151] font-[500] whitespace-nowrap">{log.actorEmail}</span>
                  </td>
                  <td className="px-[16px] py-[13px]">
                    <span className="inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] bg-blue-50 text-blue-700 border border-blue-100 whitespace-nowrap font-mono">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-[16px] py-[13px]">
                    {log.targetType ? (
                      <div className="text-[13px]">
                        <span className="inline-flex items-center px-[7px] py-[2px] rounded-full text-[11px] font-[500] bg-gray-100 text-gray-600 border border-gray-200">
                          {TARGET_TYPE_LABELS[log.targetType] ?? log.targetType}
                        </span>
                        {extractTargetLabel(log.detail) && (
                          <span className="block text-[12px] text-[#374151] font-[500] mt-[3px]">{extractTargetLabel(log.detail)}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-[#C4C9D4] text-[12px]">—</span>
                    )}
                  </td>
                  <td className="px-[16px] py-[13px] max-w-[260px]">
                    {log.detail ? (
                      <pre className="text-[11px] text-[#6B7280] whitespace-pre-wrap break-all font-mono leading-[1.5] bg-[#F8FAFC] rounded-[6px] px-[8px] py-[4px] max-h-[80px] overflow-auto">
                        {JSON.stringify(log.detail, null, 2)}
                      </pre>
                    ) : (
                      <span className="text-[#C4C9D4] text-[12px]">—</span>
                    )}
                  </td>
                  <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[12px] whitespace-nowrap">{fmtDate(log.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPage > 1 && (
        <div className="flex items-center gap-[8px] mt-[24px] justify-center">
          {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-[36px] h-[36px] rounded-[8px] text-[13px] font-[500] cursor-pointer transition-all ${
                Number(page) === p
                  ? "bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white shadow-sm"
                  : "border border-[#E5E7EB] text-[#6B7280] hover:border-[#0088FF] hover:text-[#0088FF] bg-white"
              }`}
            >{p}</button>
          ))}
        </div>
      )}
    </div>
  );
};
