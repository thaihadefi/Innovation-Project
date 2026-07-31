"use client";
import { useSearchParams } from "next/navigation";
import { Pagination } from "@/app/components/pagination/Pagination";
import { formatDateTimeVN as fmtDate } from "@/utils/date";
import { EmptyTableState } from "@/app/components/table/EmptyTableState";
import { useAdminListQuery } from "@/hooks/useAdminListQuery";
import type { PaginationMeta } from "@/types/pagination";

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

export const AuditLogsClient = ({
  logs,
  pagination,
}: {
  logs: AuditLog[];
  pagination: PaginationMeta | null;
}) => {
  const searchParams = useSearchParams();

  const actorEmail = searchParams.get("actorEmail") || "";
  const action     = searchParams.get("action")     || "";
  const { page, updateQuery, setPage } = useAdminListQuery();

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
                <EmptyTableState
                  colSpan={5}
                  title="No audit logs found"
                  subtitle="Try adjusting your filters"
                  icon={
                    <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  }
                />
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
      {pagination && (
        <Pagination
          currentPage={page}
          totalPage={pagination.totalPage}
          onPageChange={setPage}
        />
      )}
    </div>
  );
};
