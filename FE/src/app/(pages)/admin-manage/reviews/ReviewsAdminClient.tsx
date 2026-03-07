"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";
import { FaTrash } from "react-icons/fa";

type ReviewItem = {
  _id: string;
  title: string;
  overallRating: number;
  status: string;
  helpfulCount: number;
  candidateName: string;
  companyName: string;
  isAnonymous: boolean;
  createdAt: string;
};
type Pagination = { totalRecord: number; totalPage: number; currentPage: number };

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  approved: { label: "Approved", className: "bg-green-50 text-green-700 border border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-600 border border-red-200" },
};

export const ReviewsAdminClient = ({
  initialReviews,
  initialPagination,
  statusFilter,
  keyword,
}: {
  initialReviews: ReviewItem[];
  initialPagination: Pagination | null;
  statusFilter: string;
  keyword: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v);
      else params.delete(k);
    });
    params.delete("page");
    router.push(`/admin-manage/reviews?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/reviews?${params.toString()}`);
  };

  const deleteReview = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/reviews/${id}`, {
        method: "DELETE",
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
      setLoading(false);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      {/* Header */}
      <div className="mb-[20px]">
        <h1 className="text-[22px] font-[700] text-[#111827]">Reviews</h1>
        <p className="text-[13px] text-[#9CA3AF] mt-[2px]">Manage company reviews submitted by candidates</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <input
          type="text"
          placeholder="Search title, content..."
          defaultValue={keyword}
          onKeyDown={(e) => {
            if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value });
          }}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-[280px] focus:border-[#0088FF] outline-none bg-white placeholder:text-[#C4C9D4]"
        />
        <select
          value={statusFilter}
          onChange={(e) => updateQuery({ status: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[12px] text-[14px] focus:border-[#0088FF] outline-none bg-white cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Title</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Company</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Reviewer</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Rating</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Status</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Date</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-[64px]">
                    <p className="text-[14px] font-[500] text-[#374151]">No reviews found</p>
                    <p className="text-[12px] text-[#9CA3AF] mt-[2px]">Try adjusting your filters</p>
                  </td>
                </tr>
              ) : (
                initialReviews.map((r) => {
                  const cfg = statusConfig[r.status] || { label: r.status, className: "" };
                  return (
                    <tr key={r._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                      <td className="px-[16px] py-[13px]">
                        <span className="max-w-[200px] truncate block font-[500] text-[#111827]" title={r.title}>{r.title}</span>
                      </td>
                      <td className="px-[16px] py-[13px] text-[13px] text-[#374151]">{r.companyName}</td>
                      <td className="px-[16px] py-[13px]">
                        {r.isAnonymous ? (
                          <span className="text-[#9CA3AF] italic text-[13px]">Anonymous</span>
                        ) : (
                          <span className="text-[#6B7280] text-[13px]">{r.candidateName}</span>
                        )}
                      </td>
                      <td className="px-[16px] py-[13px] text-center">
                        <span className="inline-flex items-center gap-[4px] text-[13px] font-[600] text-[#FFB200]">
                          ★ {r.overallRating}
                        </span>
                      </td>
                      <td className="px-[16px] py-[13px]">
                        <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${cfg.className}`}>
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[13px] whitespace-nowrap">{fmtDate(r.createdAt)}</td>
                      <td className="px-[16px] py-[13px]">
                        <div className="flex items-center justify-center">
                          <button
                            disabled={loading}
                            onClick={() => setConfirmDeleteId(r._id)}
                            className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                          >
                            <FaTrash className="text-[9px]" /> Delete
                          </button>
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

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={deleteReview}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
