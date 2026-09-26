"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { FaCheck, FaBan, FaUndo, FaTrash } from "react-icons/fa";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";
import { Pagination } from "@/app/components/pagination/Pagination";
import { formatDateVN as fmtDate } from "@/utils/date";
import { accountStatusConfig as statusConfig } from "@/configs/variable";
import { EmptyTableState } from "@/app/components/table/EmptyTableState";
import { useAdminListQuery } from "@/hooks/useAdminListQuery";
import type { PaginationMeta } from "@/types/pagination";

export type Company = {
  _id: string;
  companyName: string;
  email: string;
  status: string;
  createdAt: string;
};

export const CompaniesClient = ({
  initialCompanies,
  initialPagination,
}: {
  initialCompanies: Company[];
  initialPagination: PaginationMeta | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";
  const { page, updateQuery, setPage } = useAdminListQuery();

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
      if (result.code === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
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
      if (result.code === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message);
        router.refresh();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div>
      
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <input
          type="text"
          placeholder="Search by name, email..."
          defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-full sm:w-[280px] focus:border-[#0088FF] outline-none bg-white transition-colors placeholder:text-[#C4C9D4]"
        />
        <select
          value={status}
          onChange={(e) => updateQuery({ status: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[12px] text-[14px] focus:border-[#0088FF] outline-none bg-white cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="initial">Pending</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Company Name</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Email</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Status</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Joined</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialCompanies.length === 0 ? (
                <EmptyTableState
                  colSpan={5}
                  title="No companies found"
                  subtitle="Try adjusting your filters"
                  icon={
                    <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                  }
                />
              ) : initialCompanies.map((c) => {
                const cfg = statusConfig[c.status] || { label: c.status, className: "" };
                return (
                  <tr key={c._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-[16px] py-[13px]">
                      <span className="font-[500] text-[#111827] whitespace-nowrap">{c.companyName}</span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span className="text-[#6B7280] whitespace-nowrap">{c.email}</span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[13px] whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                    <td className="px-[16px] py-[13px]">
                      <div className="flex items-center justify-center gap-[5px]">
                        {c.status !== "active" && (
                          <button
                            disabled={loading === c._id}
                            onClick={() => setStatus(c._id, "active")}
                            className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-green-400 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                          >
                            <FaCheck className="text-[9px]" /> Approve
                          </button>
                        )}
                        {c.status !== "inactive" && (
                          <button
                            disabled={loading === c._id}
                            onClick={() => setStatus(c._id, "inactive")}
                            className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                          >
                            <FaBan className="text-[9px]" /> {c.status === "initial" ? "Reject" : "Ban"}
                          </button>
                        )}
                        {c.status === "inactive" && (
                          <button
                            disabled={loading === c._id}
                            onClick={() => setStatus(c._id, "initial")}
                            className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-[#D1D5DB] text-[#6B7280] hover:bg-[#6B7280] hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                          >
                            <FaUndo className="text-[9px]" /> Reset
                          </button>
                        )}
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      
      {initialPagination && (
        <Pagination
          currentPage={page}
          totalPage={initialPagination.totalPage}
          onPageChange={setPage}
        />
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
