"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Job = {
  _id: string;
  title: string;
  company: { companyName: string } | null;
  status: string;
  createdAt: string;
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

  const keyword = searchParams.get("keyword") || "";
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

  const deleteJob = async (id: string) => {
    if (!confirm("Are you sure you want to delete this job? This cannot be undone.")) return;
    setLoading(id);
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

  return (
    <div>
      <div className="flex flex-wrap gap-[12px] mb-[20px]">
        <input type="text" placeholder="Search job title or company..." defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#DEDEDE] px-[14px] text-[14px] w-[280px] focus:border-[#0088FF] outline-none" />
      </div>

      <div className="bg-white rounded-[12px] shadow-sm border border-[#E8E8E8] overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[#F0F0F0] text-[#666]">
              <th className="text-left px-[16px] py-[12px] font-[600]">Job Title</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Company</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Status</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Posted</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialJobs.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-[40px] text-[#999]">No jobs found.</td></tr>
            ) : initialJobs.map((j) => (
              <tr key={j._id} className="border-b border-[#F9F9F9] hover:bg-[#FAFAFA]">
                <td className="px-[16px] py-[12px] font-[500] max-w-[260px]">
                  <span className="line-clamp-1">{j.title}</span>
                </td>
                <td className="px-[16px] py-[12px] text-[#666]">{j.company?.companyName || "—"}</td>
                <td className="px-[16px] py-[12px]">
                  <span className={`px-[8px] py-[2px] rounded-full text-[12px] font-[500] ${
                    j.status === "active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"
                  }`}>{j.status}</span>
                </td>
                <td className="px-[16px] py-[12px] text-[#999]">{new Date(j.createdAt).toLocaleDateString()}</td>
                <td className="px-[16px] py-[12px]">
                  <button disabled={loading === j._id}
                    onClick={() => deleteJob(j._id)}
                    className="text-[12px] px-[10px] py-[4px] rounded-[6px] border border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                    Delete
                  </button>
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
    </div>
  );
};
