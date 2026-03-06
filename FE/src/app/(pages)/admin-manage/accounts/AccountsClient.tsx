"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type Account = {
  _id: string;
  fullName: string;
  email: string;
  status: string;
  role: { _id: string; name: string } | null;
  createdAt: string;
};

type Role = { _id: string; name: string };
type Pagination = { totalRecord: number; totalPage: number; currentPage: number; pageSize: number };

export const AccountsClient = ({
  initialAccounts,
  initialPagination,
  roles,
}: {
  initialAccounts: Account[];
  initialPagination: Pagination | null;
  roles: Role[];
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);

  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";
  const page = searchParams.get("page") || "1";

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete("page");
    router.push(`/admin-manage/accounts?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/accounts?${params.toString()}`);
  };

  const patchStatus = async (id: string, newStatus: string) => {
    setLoading(id + "status");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success(result.message); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(null); }
  };

  const patchRole = async (id: string, roleId: string) => {
    setLoading(id + "role");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: roleId || null }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success(result.message); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(null); }
  };

  const statusColors: Record<string, string> = {
    initial: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-600",
  };

  return (
    <div>
      <div className="flex flex-wrap gap-[12px] mb-[20px]">
        <input type="text" placeholder="Search name or email..." defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#DEDEDE] px-[14px] text-[14px] w-[240px] focus:border-[#0088FF] outline-none" />
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
            <tr className="border-b border-[#F0F0F0] text-[#666]">
              <th className="text-left px-[16px] py-[12px] font-[600]">Name</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Email</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Status</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Role</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Joined</th>
              <th className="text-left px-[16px] py-[12px] font-[600]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialAccounts.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-[40px] text-[#999]">No accounts found.</td></tr>
            ) : initialAccounts.map((a) => (
              <tr key={a._id} className="border-b border-[#F9F9F9] hover:bg-[#FAFAFA]">
                <td className="px-[16px] py-[12px] font-[500]">{a.fullName}</td>
                <td className="px-[16px] py-[12px] text-[#666]">{a.email}</td>
                <td className="px-[16px] py-[12px]">
                  <span className={`px-[8px] py-[2px] rounded-full text-[12px] font-[500] ${statusColors[a.status] || ""}`}>
                    {a.status === "initial" ? "Pending" : a.status}
                  </span>
                </td>
                <td className="px-[16px] py-[12px]">
                  <select
                    defaultValue={a.role?._id || ""}
                    disabled={loading === a._id + "role"}
                    onChange={(e) => patchRole(a._id, e.target.value)}
                    className="h-[32px] rounded-[6px] border border-[#DEDEDE] px-[8px] text-[13px] focus:border-[#0088FF] outline-none cursor-pointer">
                    <option value="">No Role</option>
                    {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                  </select>
                </td>
                <td className="px-[16px] py-[12px] text-[#999]">{new Date(a.createdAt).toLocaleDateString()}</td>
                <td className="px-[16px] py-[12px]">
                  <div className="flex gap-[8px]">
                    {a.status !== "active" && (
                      <button disabled={!!loading}
                        onClick={() => patchStatus(a._id, "active")}
                        className="text-[12px] px-[10px] py-[4px] rounded-[6px] border border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                        Activate
                      </button>
                    )}
                    {a.status === "active" && (
                      <button disabled={!!loading}
                        onClick={() => patchStatus(a._id, "inactive")}
                        className="text-[12px] px-[10px] py-[4px] rounded-[6px] border border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                        Deactivate
                      </button>
                    )}
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
    </div>
  );
};
