"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FaCheck, FaBan, FaUndo, FaTrash } from "react-icons/fa";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";

type Company = {
  _id: string;
  companyName: string;
  email: string;
  status: string;
  createdAt: string;
};

type Pagination = { totalRecord: number; totalPage: number; currentPage: number; pageSize: number };

export const CompaniesClient = ({
  initialCompanies,
  initialPagination,
}: {
  initialCompanies: Company[];
  initialPagination: Pagination | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";
  const page = searchParams.get("page") || "1";

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete("page");
    router.push(`/admin-manage/companies?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/companies?${params.toString()}`);
  };

  const setStatus = async (id: string, newStatus: string) => {
    setLoading(id);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/companies/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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

  const statusColors: Record<string, string> = {
    initial: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-600",
  };

  const deleteCompany = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setLoading(id + "delete");
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/companies/${id}`, {
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
      <div className="flex flex-wrap gap-[12px] mb-[20px]">
        <input type="text" placeholder="Search company name or email..." defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#DEDEDE] px-[14px] text-[14px] w-[280px] focus:border-[#0088FF] outline-none" />
        <select value={status} onChange={(e) => updateQuery({ status: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#DEDEDE] px-[12px] text-[14px] focus:border-[#0088FF] outline-none">
          <option value="">All Status</option>
          <option value="initial">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-[12px] shadow-sm border border-[#E8E8E8] overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA] text-[#6B7280]">
              <th className="text-left px-[16px] py-[11px] font-[600] text-[11.5px] uppercase tracking-[0.4px] whitespace-nowrap">Company Name</th>
              <th className="text-left px-[16px] py-[11px] font-[600] text-[11.5px] uppercase tracking-[0.4px] whitespace-nowrap">Email</th>
              <th className="text-left px-[16px] py-[11px] font-[600] text-[11.5px] uppercase tracking-[0.4px] whitespace-nowrap">Status</th>
              <th className="text-left px-[16px] py-[11px] font-[600] text-[11.5px] uppercase tracking-[0.4px] whitespace-nowrap">Joined</th>
              <th className="text-center px-[16px] py-[11px] font-[600] text-[11.5px] uppercase tracking-[0.4px] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialCompanies.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-[56px]">
                  <div className="flex flex-col items-center gap-[8px] text-[#9CA3AF]">
                    <svg className="w-[32px] h-[32px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                    <p className="text-[14px] font-[500]">No companies found</p>
                    <p className="text-[12px]">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : initialCompanies.map((c) => (
              <tr key={c._id} className="border-b border-[#F9F9F9] hover:bg-[#FAFAFA] transition-colors">
                <td className="px-[16px] py-[12px] font-[500] text-[#111827] whitespace-nowrap">
                  {c.companyName}
                </td>
                <td className="px-[16px] py-[12px] text-[#6B7280] whitespace-nowrap">
                  {c.email}
                </td>
                <td className="px-[16px] py-[12px]">
                  <span className={`px-[8px] py-[2px] rounded-full text-[12px] font-[500] whitespace-nowrap ${statusColors[c.status] || ""}`}>
                    {c.status === "initial" ? "Pending" : c.status}
                  </span>
                </td>
                <td className="px-[16px] py-[12px] text-[#9CA3AF] text-[13px] whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                <td className="px-[16px] py-[12px]">
                  <div className="flex items-center justify-center gap-[6px]">
                    {c.status !== "active" && (
                      <button disabled={loading === c._id}
                        onClick={() => setStatus(c._id, "active")}
                        className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                        <FaCheck className="text-[10px]" /> Approve
                      </button>
                    )}
                    {c.status !== "inactive" && (
                      <button disabled={loading === c._id}
                        onClick={() => setStatus(c._id, "inactive")}
                        className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                        <FaBan className="text-[10px]" /> {c.status === "initial" ? "Reject" : "Ban"}
                      </button>
                    )}
                    {c.status === "inactive" && (
                      <button disabled={loading === c._id}
                        onClick={() => setStatus(c._id, "initial")}
                        className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-[#999] text-[#666] hover:bg-[#666] hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                        <FaUndo className="text-[10px]" /> Reset
                      </button>
                    )}
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

      {initialPagination && initialPagination.totalPage > 1 && (
        <div className="flex items-center gap-[8px] mt-[20px] justify-center">
          {Array.from({ length: initialPagination.totalPage }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-[36px] h-[36px] rounded-[8px] text-[14px] font-[500] cursor-pointer transition-all ${
                Number(page) === p ? "bg-[#0088FF] text-white" : "border border-[#DEDEDE] text-[#666] hover:border-[#0088FF]"
              }`}>{p}</button>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Company"
        message="Are you sure you want to delete this company? All associated data (jobs, applications, reviews, followers, etc.) will be permanently deleted. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deleteCompany}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
