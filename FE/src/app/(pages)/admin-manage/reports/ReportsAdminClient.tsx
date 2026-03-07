"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FaCheck, FaTimes, FaTrash, FaEye } from "react-icons/fa";
import DOMPurify from "isomorphic-dompurify";

type ReportItem = {
  _id: string;
  targetType: "review" | "comment";
  targetId: string;
  reporterName: string;
  reporterType: "candidate" | "company" | "guest";
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  targetContent: string | null;
  targetTitle: string | null;
  targetDeleted: boolean;
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
  keywordFilter,
}: {
  initialReports: ReportItem[];
  initialPagination: Pagination | null;
  statusFilter: string;
  targetTypeFilter: string;
  keywordFilter: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewReport, setPreviewReport] = useState<ReportItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<ReportItem | null>(null);

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

  const deleteTarget = async (report: ReportItem) => {
    setLoading(report._id + "delete");
    try {
      const url =
        report.targetType === "review"
          ? `${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/${report.targetId}`
          : `${process.env.NEXT_PUBLIC_API_URL}/admin/experiences/comments/${report.targetId}`;
      const res = await fetch(url, { method: "DELETE", credentials: "include" });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else {
        toast.success(result.message);
        // Auto-resolve the report after deleting the target
        await updateStatus(report._id, "resolved");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(null);
      setConfirmDelete(null);
    }
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <input
          type="text"
          placeholder="Search by content, reporter, reason..."
          defaultValue={keywordFilter}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-full sm:w-[240px] focus:border-[#0088FF] outline-none bg-white transition-colors placeholder:text-[#C4C9D4]"
        />
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
          <table className="w-full text-[14px] min-w-[900px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Type</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Content</th>
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
                  <td colSpan={7} className="text-center py-[64px]">
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
                        {r.targetDeleted ? (
                          <span className="text-[12px] text-[#9CA3AF] italic">Deleted</span>
                        ) : (
                          <button
                            onClick={() => setPreviewReport(r)}
                            className="flex items-center gap-[4px] text-[12px] text-[#0088FF] hover:text-[#006FCC] cursor-pointer transition-colors font-[500]"
                          >
                            <FaEye className="text-[10px]" />
                            Preview
                          </button>
                        )}
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
                        <div className="flex items-center justify-center gap-[5px] flex-wrap">
                          {r.status === "pending" && (
                            <>
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
                            </>
                          )}
                          {!r.targetDeleted && (
                            <button
                              disabled={!!loading}
                              onClick={() => setConfirmDelete(r)}
                              className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                            >
                              <FaTrash className="text-[9px]" /> Delete {r.targetType === "review" ? "Review" : "Comment"}
                            </button>
                          )}
                        </div>
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
              className={`w-[36px] h-[36px] rounded-[8px] text-[13px] font-[500] cursor-pointer transition-all ${
                initialPagination.currentPage === p
                  ? "bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white shadow-sm"
                  : "border border-[#E5E7EB] text-[#6B7280] hover:border-[#0088FF] hover:text-[#0088FF] bg-white"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewReport && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setPreviewReport(null)}>
          <div
            className="bg-white rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-[520px] max-h-[80vh] overflow-hidden flex flex-col mx-[16px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#F0F2F5]">
              <h3 className="text-[15px] font-[600] text-[#111827]">
                {previewReport.targetType === "review" ? "Review" : "Comment"} Preview
              </h3>
              <button
                onClick={() => setPreviewReport(null)}
                className="w-[28px] h-[28px] rounded-full flex items-center justify-center hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                <FaTimes className="text-[12px] text-[#9CA3AF]" />
              </button>
            </div>
            <div className="px-[24px] py-[20px] overflow-y-auto flex-1">
              {previewReport.targetTitle && (
                <div className="mb-[14px]">
                  <span className="text-[11px] font-[600] text-[#9CA3AF] uppercase tracking-[0.5px]">Title</span>
                  <p className="text-[14px] text-[#111827] font-[500] mt-[4px]">{previewReport.targetTitle}</p>
                </div>
              )}
              <div className="mb-[14px]">
                <span className="text-[11px] font-[600] text-[#9CA3AF] uppercase tracking-[0.5px]">Content</span>
                <div className="mt-[4px] p-[14px] bg-[#F9FAFB] rounded-[10px] border border-[#F0F2F5]">
                  {previewReport.targetContent ? (
                    <div
                      className="text-[13px] text-[#374151] leading-[1.7] prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewReport.targetContent) }}
                    />
                  ) : (
                    <p className="text-[13px] italic text-[#9CA3AF]">No content available</p>
                  )}
                </div>
              </div>
              <div>
                <span className="text-[11px] font-[600] text-[#9CA3AF] uppercase tracking-[0.5px]">Report Reason</span>
                <div className="mt-[4px] p-[14px] bg-red-50 rounded-[10px] border border-red-100">
                  <p className="text-[13px] text-red-700 leading-[1.7]">{previewReport.reason}</p>
                </div>
              </div>
              <div className="mt-[14px] flex items-center gap-[12px] text-[12px] text-[#9CA3AF]">
                <span>Reported by: <strong className="text-[#374151]">{previewReport.reporterName}</strong> ({previewReport.reporterType})</span>
                <span>•</span>
                <span>{fmtDate(previewReport.createdAt)}</span>
              </div>
            </div>
            <div className="px-[24px] py-[14px] border-t border-[#F0F2F5] flex justify-end gap-[8px]">
              <button
                onClick={() => setPreviewReport(null)}
                className="h-[34px] px-[16px] rounded-[8px] text-[13px] font-[500] border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors cursor-pointer"
              >
                Close
              </button>
              {!previewReport.targetDeleted && (
                <button
                  onClick={() => {
                    setConfirmDelete(previewReport);
                    setPreviewReport(null);
                  }}
                  className="h-[34px] px-[16px] rounded-[8px] text-[13px] font-[500] bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer"
                >
                  <FaTrash className="inline text-[10px] mr-[5px]" />
                  Delete {previewReport.targetType === "review" ? "Review" : "Comment"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div
            className="bg-white rounded-[16px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] w-full max-w-[440px] overflow-hidden mx-[16px]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-[24px] py-[20px]">
              <div className="flex items-center gap-[12px] mb-[14px]">
                <div className="w-[40px] h-[40px] rounded-full bg-red-50 flex items-center justify-center">
                  <FaTrash className="text-[14px] text-red-500" />
                </div>
                <div>
                  <h3 className="text-[15px] font-[600] text-[#111827]">
                    Delete {confirmDelete.targetType === "review" ? "Review" : "Comment"}
                  </h3>
                  <p className="text-[12px] text-[#9CA3AF]">This action cannot be undone</p>
                </div>
              </div>
              <p className="text-[13px] text-[#6B7280] leading-[1.6]">
                Are you sure you want to permanently delete this {confirmDelete.targetType === "review" ? "review" : "comment"}?
                {confirmDelete.targetType === "comment" && " All replies to this comment will also be removed."}
                {" "}The report will be automatically resolved.
              </p>
            </div>
            <div className="px-[24px] py-[14px] border-t border-[#F0F2F5] flex justify-end gap-[8px]">
              <button
                disabled={!!loading}
                onClick={() => setConfirmDelete(null)}
                className="h-[34px] px-[16px] rounded-[8px] text-[13px] font-[500] border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                disabled={!!loading}
                onClick={() => deleteTarget(confirmDelete)}
                className="h-[34px] px-[16px] rounded-[8px] text-[13px] font-[500] bg-red-500 text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                {loading === confirmDelete._id + "delete" ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
