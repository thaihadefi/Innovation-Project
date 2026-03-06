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

  const pagination = initialPagination;

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
      <div className="flex flex-wrap gap-[12px] mb-[20px]">
        <input type="text" placeholder="Search name or email..." defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#DEDEDE] px-[14px] text-[14px] w-[240px] focus:border-[#0088FF] outline-none" />
        <select value={status} onChange={(e) => updateQuery({ status: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#DEDEDE] px-[12px] text-[14px] focus:border-[#0088FF] outline-none">
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        <select value={verified} onChange={(e) => updateQuery({ verified: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#DEDEDE] px-[12px] text-[14px] focus:border-[#0088FF] outline-none">
          <option value="">Verification</option>
          <option value="true">Verified</option>
          <option value="false">Unverified</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] shadow-sm border border-[#E8E8E8] overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Name</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Email</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Student ID</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Cohort</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Major</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Status</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Verified</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Joined</th>
              <th className="text-center px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialCandidates.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-[56px]">
                  <div className="flex flex-col items-center gap-[8px] text-[#9CA3AF]">
                    <svg className="w-[32px] h-[32px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <p className="text-[14px] font-[500]">No candidates found</p>
                    <p className="text-[12px]">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : initialCandidates.map((c) => (
              <tr key={c._id} className="border-b border-[#F9F9F9] hover:bg-[#FAFAFA]">
                <td className="px-[16px] py-[12px] font-[500] whitespace-nowrap">
                  {c.fullName}
                </td>
                <td className="px-[16px] py-[12px] text-[#666] whitespace-nowrap">
                  {c.email}
                </td>
                <td className="px-[16px] py-[12px] text-[#666] whitespace-nowrap">{c.studentId || <span className="text-[#CCC]">—</span>}</td>
                <td className="px-[16px] py-[12px] text-[#666] whitespace-nowrap">{c.cohort || <span className="text-[#CCC]">—</span>}</td>
                <td className="px-[16px] py-[12px] text-[#666] whitespace-nowrap">
                  {c.major || <span className="text-[#CCC]">—</span>}
                </td>
                <td className="px-[16px] py-[12px]">
                  <span className={`px-[8px] py-[2px] rounded-full text-[12px] font-[500] whitespace-nowrap ${
                    c.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
                  }`}>{c.status}</span>
                </td>
                <td className="px-[16px] py-[12px]">
                  <span className={`px-[8px] py-[2px] rounded-full text-[12px] font-[500] whitespace-nowrap ${
                    c.isVerified ? "bg-blue-100 text-blue-700" : "bg-yellow-100 text-yellow-700"
                  }`}>{c.isVerified ? "Verified" : "Unverified"}</span>
                </td>
                <td className="px-[16px] py-[12px] text-[#999] text-[13px] whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                <td className="px-[16px] py-[12px]">
                  <div className="flex items-center justify-center gap-[6px]">
                    <button disabled={!!loading}
                      onClick={() => patchAction(c._id, "verify", { isVerified: !c.isVerified })}
                      className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                      {c.isVerified ? <><FaTimes className="text-[10px]" /> Unverify</> : <><FaCheck className="text-[10px]" /> Verify</>}
                    </button>
                    <button disabled={!!loading}
                      onClick={() => patchAction(c._id, "status", { status: c.status === "active" ? "inactive" : "active" })}
                      className={`inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap ${
                        c.status === "active"
                          ? "border-red-400 text-red-500 hover:bg-red-500 hover:text-white"
                          : "border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
                      }`}>
                      {c.status === "active" ? <><FaBan className="text-[10px]" /> Ban</> : <><FaUndo className="text-[10px]" /> Unban</>}
                    </button>
                    <button disabled={!!loading}
                      onClick={() => setConfirmDeleteId(c._id)}
                      className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                      <FaTrash className="text-[10px]" /> Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPage > 1 && (
        <div className="flex items-center gap-[8px] mt-[20px] justify-center">
          {Array.from({ length: pagination.totalPage }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-[36px] h-[36px] rounded-[8px] text-[14px] font-[500] cursor-pointer transition-all ${
                Number(page) === p ? "bg-[#0088FF] text-white" : "border border-[#DEDEDE] text-[#666] hover:border-[#0088FF]"
              }`}>{p}</button>
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
