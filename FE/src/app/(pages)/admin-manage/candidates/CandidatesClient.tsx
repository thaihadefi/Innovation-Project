"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FaCheck, FaTimes, FaBan, FaUndo, FaTrash } from "react-icons/fa";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";

type Candidate = {
  _id: string;
  fullName: string;
  email: string;
  studentId?: string;
  cohort?: number;
  major?: string;
  status: string;
  isVerified: boolean;
  createdAt: string;
};

type Pagination = { totalRecord: number; totalPage: number; currentPage: number; pageSize: number };

export const CandidatesClient = ({
  initialCandidates,
  initialPagination,
}: {
  initialCandidates: Candidate[];
  initialPagination: Pagination | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";
  const verified = searchParams.get("verified") || "";
  const page = searchParams.get("page") || "1";

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete("page");
    router.push(`/admin-manage/candidates?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/candidates?${params.toString()}`);
  };

  const patchAction = async (id: string, path: string, body: object) => {
    setLoading(id + path);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/candidates/${id}/${path}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success(result.message); router.refresh(); }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const deleteCandidate = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setLoading(id + "delete");
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/candidates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success(result.message); router.refresh(); }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <input
          type="text"
          placeholder="Search name or email..."
          defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-[240px] focus:border-[#0088FF] outline-none bg-white transition-colors placeholder:text-[#C4C9D4]"
        />
        <select
          value={status}
          onChange={(e) => updateQuery({ status: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[12px] text-[14px] focus:border-[#0088FF] outline-none bg-white cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select
          value={verified}
          onChange={(e) => updateQuery({ verified: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[12px] text-[14px] focus:border-[#0088FF] outline-none bg-white cursor-pointer"
        >
          <option value="">Verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Name</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Email</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Student ID</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Cohort</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Major</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Status</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Verified</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Joined</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialCandidates.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-[64px]">
                    <div className="flex flex-col items-center gap-[10px] text-[#9CA3AF]">
                      <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center">
                        <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-[500] text-[#374151]">No candidates found</p>
                        <p className="text-[12px] mt-[2px]">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : initialCandidates.map((c) => (
                <tr key={c._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-[16px] py-[13px]">
                    <span className="max-w-[140px] truncate block font-[500] text-[#111827]" title={c.fullName}>{c.fullName}</span>
                  </td>
                  <td className="px-[16px] py-[13px]">
                    <span className="max-w-[180px] truncate block text-[#6B7280]" title={c.email}>{c.email}</span>
                  </td>
                  <td className="px-[16px] py-[13px] text-[#6B7280]">{c.studentId || <span className="text-[#D1D5DB]">—</span>}</td>
                  <td className="px-[16px] py-[13px] text-[#6B7280]">{c.cohort || <span className="text-[#D1D5DB]">—</span>}</td>
                  <td className="px-[16px] py-[13px]">
                    <span className="max-w-[120px] truncate block text-[#6B7280]" title={c.major || ""}>{c.major || <span className="text-[#D1D5DB]">—</span>}</span>
                  </td>
                  <td className="px-[16px] py-[13px]">
                    <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${
                      c.status === "active" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-600 border border-red-200"
                    }`}>{c.status}</span>
                  </td>
                  <td className="px-[16px] py-[13px]">
                    <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${
                      c.isVerified ? "bg-blue-50 text-blue-700 border border-blue-200" : "bg-yellow-50 text-yellow-700 border border-yellow-200"
                    }`}>{c.isVerified ? "Verified" : "Unverified"}</span>
                  </td>
                  <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[13px] whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                  <td className="px-[16px] py-[13px]">
                    <div className="flex items-center justify-center gap-[5px]">
                      <button
                        disabled={!!loading}
                        onClick={() => patchAction(c._id, "verify", { isVerified: !c.isVerified })}
                        className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                      >
                        {c.isVerified ? <><FaTimes className="text-[9px]" /> Unverify</> : <><FaCheck className="text-[9px]" /> Verify</>}
                      </button>
                      <button
                        disabled={!!loading}
                        onClick={() => patchAction(c._id, "status", { status: c.status === "active" ? "inactive" : "active" })}
                        className={`inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500] ${
                          c.status === "active"
                            ? "border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500"
                            : "border-green-400 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500"
                        }`}
                      >
                        {c.status === "active" ? <><FaBan className="text-[9px]" /> Ban</> : <><FaUndo className="text-[9px]" /> Unban</>}
                      </button>
                      <button
                        disabled={!!loading}
                        onClick={() => setConfirmDeleteId(c._id)}
                        className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                      >
                        <FaTrash className="text-[9px]" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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
                Number(page) === p
                  ? "bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white shadow-sm"
                  : "border border-[#E5E7EB] text-[#6B7280] hover:border-[#0088FF] hover:text-[#0088FF] bg-white"
              }`}
            >{p}</button>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Candidate"
        message="Are you sure you want to delete this candidate? All associated data (CVs, saved jobs, reviews, etc.) will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deleteCandidate}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
