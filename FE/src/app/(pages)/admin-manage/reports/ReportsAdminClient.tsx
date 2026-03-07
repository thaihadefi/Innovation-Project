"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaCheck, FaTimes } from "react-icons/fa";

type ReportItem = {
  _id: string;
  targetType: "review" | "comment";
  targetId: string;
  reporterName: string;
  reporterType: "candidate" | "company";
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  createdAt: string;
};
type Pagination = { totalRecord: number; totalPage: number; currentPage: number };

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  resolved: { label: "Resolved", className: "bg-green-50 text-green-700 border border-green-200" },
  dismissed: { label: "Dismissed", className: "bg-gray-50 text-gray-600 border border-gray-200" },
};

export const ReportsAdminClient = ({
  initialReports,
  initialPagination,
  statusFilter,
  targetTypeFilter,
}: {
  initialReports: ReportItem[];
  initialPagination: Pagination | null;
  statusFilter: string;
  targetTypeFilter: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.delete("page");
    router.push(`/admin-manage/reports?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/reports?${params.toString()}`);
  };

  const updateStatus = async (id: string, status: string) => {
    setLoading(id + status);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reports/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else {
        toast.success(result.message);
        router.refresh();
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(null);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="mb-[20px]">
        <h1 className="text-[22px] font-[700] text-[#111827]">Reports</h1>
        <p className="text-[13px] text-[#9CA3AF] mt-[2px]">User-submitted reports on reviews and comments</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <select
          value={statusFilter}
          onChange={(e) => updateQuery({ status: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[12px] text-[14px] focus:border-[#0088FF] outline-none bg-white cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="resolved">Resolved</option>
          <option value="dismissed">Dismissed</option>
        </select>
        <select
          value={targetTypeFilter}
          onChange={(e) => updateQuery({ targetType: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[12px] text-[14px] focus:border-[#0088FF] outline-none bg-white cursor-pointer"
        >
          <option value="">All Types</option>
          <option value="review">Reviews</option>
          <option value="comment">Comments</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Type</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Reporter</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Reason</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Status</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Date</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialReports.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-[64px]">
                    <p className="text-[14px] font-[500] text-[#374151]">No reports found</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-[2px]">All clear!</p>
                  </td>
                </tr>
              ) : (
                initialReports.map((r) => {
                  const cfg = statusConfig[r.status] || { label: r.status, className: "" };
                  return (
                    <tr key={r._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                      <td className="px-[16px] py-[13px]">
                        <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${
                          r.targetType === "review"
                            ? "bg-blue-50 text-blue-700 border border-blue-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {r.targetType === "review" ? "Review" : "Comment"}
                        </span>
                      </td>
                      <td className="px-[16px] py-[13px]">
                        <div>
                          <span className="text-[13px] text-[#374151] font-[500]">{r.reporterName}</span>
                          <span className="text-[11px] text-[#9CA3AF] ml-[6px]">({r.reporterType})</span>
                        </div>
                      </td>
                      <td className="px-[16px] py-[13px]">
                        <span className="max-w-[280px] block truncate text-[13px] text-[#6B7280]" title={r.reason}>
                          {r.reason}
                        </span>
                      </td>
                      <td className="px-[16px] py-[13px]">
                        <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[13px] whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                      <td className="px-[16px] py-[13px]">
                        {r.status === "pending" ? (
                          <div className="flex items-center justify-center gap-[5px]">
                            <button
                              disabled={!!loading}
                              onClick={() => updateStatus(r._id, "resolved")}
                              className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-green-300 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                            >
                              <FaCheck className="text-[9px]" /> Resolve
                            </button>
                            <button
                              disabled={!!loading}
                              onClick={() => updateStatus(r._id, "dismissed")}
                              className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-gray-300 text-gray-500 hover:bg-gray-500 hover:text-white hover:border-gray-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                            >
                              <FaTimes className="text-[9px]" /> Dismiss
                            </button>
                          </div>
                        ) : (
                          <div className="text-center text-[12px] text-[#9CA3AF]">—</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {initialPagination && initialPagination.totalPage > 1 && (
        <div className="flex items-center gap-[8px] mt-[24px] justify-center">
          {Array.from({ length: initialPagination.totalPage }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-[34px] h-[34px] rounded-[8px] text-[13px] font-[500] cursor-pointer transition-all ${
                initialPagination.currentPage === p
                  ? "bg-[#0088FF] text-white"
                  : "border border-[#E5E7EB] text-[#666] hover:border-[#0088FF]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
