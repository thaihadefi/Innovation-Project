"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";
import { FaTrash, FaEye, FaTimes, FaCheck } from "react-icons/fa";

type Post = {
  _id: string;
  title: string;
  companyName: string;
  position: string;
  result: string;
  difficulty: string;
  authorName: string;
  isAnonymous: boolean;
  status: string;
  content: string;
  createdAt: string;
};
type Pagination = { totalRecord: number; totalPage: number; currentPage: number };

const statusConfig: Record<string, { label: string; className: string }> = {
  pending: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
  approved: { label: "Approved", className: "bg-green-50 text-green-700 border border-green-200" },
  rejected: { label: "Rejected", className: "bg-red-50 text-red-600 border border-red-200" },
};

export const InterviewExperiencesAdminClient = ({
  initialPosts,
  initialPagination,
  statusFilter,
  keyword,
}: {
  initialPosts: Post[];
  initialPagination: Pagination | null;
  statusFilter: string;
  keyword: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [previewPost, setPreviewPost] = useState<Post | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete("page");
    router.push(`/admin-manage/interview-experiences?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/interview-experiences?${params.toString()}`);
  };

  const patchStatus = async (id: string, status: string) => {
    setLoading(id + status);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/experiences/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success(result.message); setPreviewPost(null); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(null); }
  };

  const deletePost = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setLoading(id + "del");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/experiences/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success(result.message); setPreviewPost(null); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(null); }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <input
          type="text"
          placeholder="Search title, company, author..."
          defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
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
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Company · Role</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Author</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Status</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Submitted</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-[64px]">
                    <div className="flex flex-col items-center gap-[10px] text-[#9CA3AF]">
                      <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center">
                        <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-[500] text-[#374151]">No posts found</p>
                        <p className="text-[12px] mt-[2px]">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : initialPosts.map((p) => {
                const cfg = statusConfig[p.status] || { label: p.status, className: "" };
                return (
                  <tr key={p._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-[16px] py-[13px]">
                      <span className="max-w-[200px] truncate block font-[500] text-[#111827]" title={p.title}>{p.title}</span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <div className="max-w-[160px]">
                        <div className="truncate font-[500] text-[#374151] text-[13px]" title={p.companyName}>{p.companyName}</div>
                        <div className="truncate text-[12px] text-[#9CA3AF] mt-[1px]" title={p.position}>{p.position}</div>
                      </div>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      {p.isAnonymous
                        ? <span className="text-[#9CA3AF] italic text-[13px]">Anonymous</span>
                        : <span className="text-[#6B7280] text-[13px] whitespace-nowrap">{p.authorName}</span>
                      }
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[13px] whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                    <td className="px-[16px] py-[13px]">
                      <div className="flex items-center justify-center gap-[5px]">
                        <button
                          onClick={() => setPreviewPost(p)}
                          className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all cursor-pointer whitespace-nowrap font-[500]"
                        >
                          <FaEye className="text-[9px]" /> Preview
                        </button>
                        <button
                          disabled={!!loading}
                          onClick={() => setConfirmDeleteId(p._id)}
                          className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                        >
                          <FaTrash className="text-[9px]" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
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
            >{p}</button>
          ))}
        </div>
      )}

      {/* Preview Modal */}
      {previewPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[16px]" onClick={() => setPreviewPost(null)}>
          <div
            className="bg-white rounded-[16px] w-full max-w-[720px] max-h-[88vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.15)]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-[28px] py-[20px] border-b border-[#F0F2F5]">
              <div className="flex items-start justify-between gap-[12px]">
                <div className="flex-1 min-w-0">
                  <h2 className="font-[700] text-[17px] text-[#111827] truncate">{previewPost.title}</h2>
                  <p className="text-[13px] text-[#6B7280] mt-[3px]">
                    <span className="font-[500] text-[#374151]">{previewPost.companyName}</span>
                    {" · "}{previewPost.position}
                    {" · "}{previewPost.isAnonymous ? <span className="italic">Anonymous</span> : previewPost.authorName}
                  </p>
                </div>
                <div className="flex items-center gap-[8px] shrink-0">
                  <span className={`px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${(statusConfig[previewPost.status] || { className: "" }).className}`}>
                    {(statusConfig[previewPost.status] || { label: previewPost.status }).label}
                  </span>
                  <button
                    onClick={() => setPreviewPost(null)}
                    className="w-[30px] h-[30px] rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <FaTimes className="text-[11px] text-[#6B7280]" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto px-[28px] py-[20px]">
              <div
                className="prose prose-sm max-w-none text-[14px] leading-relaxed text-[#374151]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewPost.content) }}
              />
            </div>

            {/* Modal Actions */}
            <div className="px-[28px] py-[16px] border-t border-[#F0F2F5] flex gap-[8px] flex-wrap justify-end bg-[#FAFBFC] rounded-b-[16px]">
              <button
                onClick={() => setPreviewPost(null)}
                className="h-[36px] px-[16px] rounded-[8px] border border-[#E5E7EB] text-[13px] text-[#6B7280] hover:bg-[#F5F7FA] transition-all cursor-pointer font-[500]"
              >
                Close
              </button>
              {previewPost.status !== "rejected" && (
                <button
                  disabled={!!loading}
                  onClick={() => patchStatus(previewPost._id, "rejected")}
                  className="h-[36px] px-[16px] rounded-[8px] border border-red-300 text-red-500 hover:bg-red-500 hover:text-white text-[13px] transition-all cursor-pointer disabled:opacity-50 font-[500]"
                >
                  Reject
                </button>
              )}
              {previewPost.status !== "approved" && (
                <button
                  disabled={!!loading}
                  onClick={() => patchStatus(previewPost._id, "approved")}
                  className="h-[36px] px-[16px] rounded-[8px] bg-gradient-to-r from-[#22C55E] to-[#16A34A] text-white hover:from-[#16A34A] hover:to-[#15803D] text-[13px] font-[600] transition-all cursor-pointer disabled:opacity-50 inline-flex items-center gap-[6px]"
                >
                  <FaCheck className="text-[11px]" /> Approve
                </button>
              )}
              <button
                disabled={!!loading}
                onClick={() => { setConfirmDeleteId(previewPost._id); setPreviewPost(null); }}
                className="h-[36px] px-[16px] rounded-[8px] border border-red-300 text-red-500 hover:bg-red-500 hover:text-white text-[13px] transition-all cursor-pointer disabled:opacity-50 font-[500]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Post"
        message="Are you sure you want to delete this post? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deletePost}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
