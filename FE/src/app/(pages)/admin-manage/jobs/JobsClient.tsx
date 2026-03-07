"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { FaEye, FaTrash } from "react-icons/fa";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";

type Job = {
  _id: string;
  title: string;
  slug: string;
  companyName: string;
  salaryMin: number;
  salaryMax: number;
  locationNames: string[];
  applicationCount: number;
  createdAt: string;
  expirationDate: string | null;
};

type Pagination = { totalRecord: number; totalPage: number; currentPage: number; pageSize: number };

export const JobsClient = ({
  initialJobs,
  initialPagination,
}: {
  initialJobs: Job[];
  initialPagination: Pagination | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";
  const page = searchParams.get("page") || "1";

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete("page");
    router.push(`/admin-manage/jobs?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/jobs?${params.toString()}`);
  };

  const deleteJob = async () => {
    if (!confirmId) return;
    const id = confirmId;
    setLoading(id);
    setConfirmId(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/jobs/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success("Job deleted."); router.refresh(); }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const formatSalary = (min: number, max: number) => {
    if (!min && !max) return "—";
    const fmt = (n: number) => n.toLocaleString("vi-VN");
    if (min && max) return `${fmt(min)} – ${fmt(max)}`;
    if (min) return `From ${fmt(min)}`;
    return `Up to ${fmt(max)}`;
  };

  const getExpStatus = (job: Job) => {
    if (!job.expirationDate) return { label: "Active", className: "bg-green-50 text-green-700 border border-green-200" };
    const now = new Date();
    const exp = new Date(job.expirationDate);
    if (exp < now) return { label: "Expired", className: "bg-red-50 text-red-600 border border-red-200" };
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 3) return { label: `${diffDays}d left`, className: "bg-orange-50 text-orange-600 border border-orange-200" };
    return { label: "Active", className: "bg-green-50 text-green-700 border border-green-200" };
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <input
          type="text"
          placeholder="Search by title, company, position..."
          defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-full sm:w-[320px] focus:border-[#0088FF] outline-none bg-white transition-colors placeholder:text-[#C4C9D4]"
        />
        <select
          value={status}
          onChange={(e) => updateQuery({ status: e.target.value })}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[12px] text-[14px] focus:border-[#0088FF] outline-none bg-white cursor-pointer"
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[900px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Job Title</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Company</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Location</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Salary (VND)</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Status</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Posted</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Apps</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialJobs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-[64px]">
                    <div className="flex flex-col items-center gap-[10px] text-[#9CA3AF]">
                      <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center">
                        <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-[500] text-[#374151]">No jobs found</p>
                        <p className="text-[12px] mt-[2px]">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : initialJobs.map((j) => {
                const expStatus = getExpStatus(j);
                return (
                  <tr key={j._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-[16px] py-[13px]">
                      <span className="font-[500] text-[#111827] whitespace-nowrap">{j.title}</span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span className="text-[#6B7280] whitespace-nowrap">{j.companyName || "—"}</span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      {!j.locationNames || j.locationNames.length === 0 ? (
                        <span className="text-[#D1D5DB]">—</span>
                      ) : (
                        <div className="flex flex-wrap gap-[3px]" title={j.locationNames.join(", ")}>
                          {j.locationNames.map((loc, i) => (
                            <span key={i} className="inline-block px-[6px] py-[2px] bg-[#EEF6FF] text-[#0088FF] text-[11px] rounded-[4px] whitespace-nowrap font-[500]">
                              {loc}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-[16px] py-[13px] text-[#6B7280] whitespace-nowrap text-[13px]">
                      {formatSalary(j.salaryMin, j.salaryMax)}
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${expStatus.className}`}>
                        {expStatus.label}
                      </span>
                    </td>
                    <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[13px] whitespace-nowrap">
                      {formatDate(j.createdAt)}
                    </td>
                    <td className="px-[16px] py-[13px] text-center">
                      <span className="inline-flex items-center justify-center w-[24px] h-[24px] rounded-full bg-[#F3F4F6] text-[12px] font-[600] text-[#6B7280]">
                        {j.applicationCount || 0}
                      </span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <div className="flex items-center justify-center gap-[5px]">
                        <Link
                          href={`/job/detail/${j.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all whitespace-nowrap font-[500]"
                        >
                          <FaEye className="text-[9px]" /> View
                        </Link>
                        <button
                          disabled={loading === j._id}
                          onClick={() => setConfirmId(j._id)}
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
                Number(page) === p
                  ? "bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white shadow-sm"
                  : "border border-[#E5E7EB] text-[#6B7280] hover:border-[#0088FF] hover:text-[#0088FF] bg-white"
              }`}
            >{p}</button>
          ))}
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmId}
        title="Delete Job"
        message="Are you sure you want to delete this job? All associated applications will also be deleted. This cannot be undone."
        confirmLabel="Delete"
        onConfirm={deleteJob}
        onCancel={() => setConfirmId(null)}
      />
    </div>
  );
};
