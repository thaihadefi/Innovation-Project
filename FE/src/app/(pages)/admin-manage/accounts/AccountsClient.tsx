"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";
import { FaEdit, FaTrash, FaCheck, FaBan } from "react-icons/fa";
import { AccountModal } from "./AccountModal";

type Account = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;
  isSuperAdmin?: boolean;
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const keyword = searchParams.get("keyword") || "";
  const status = searchParams.get("status") || "";
  const roleId = searchParams.get("roleId") || "";
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

  const patchRole = async (id: string, newRoleId: string) => {
    setLoading(id + "role");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts/${id}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roleId: newRoleId || null }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success(result.message); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(null); }
  };

  const deleteAccount = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setLoading(id + "delete");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success("Account deleted."); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(null); }
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    initial: { label: "Pending", className: "bg-yellow-50 text-yellow-700 border border-yellow-200" },
    active: { label: "Active", className: "bg-green-50 text-green-700 border border-green-200" },
    inactive: { label: "Inactive", className: "bg-red-50 text-red-600 border border-red-200" },
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  useEffect(() => {
    if (!showCreateModal && !editAccount) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowCreateModal(false); setEditAccount(null); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showCreateModal, editAccount]);

  return (
    <div>
      {/* Filters + Create */}
      <div className="flex flex-wrap gap-[10px] mb-[20px] items-center justify-between">
        <div className="flex flex-wrap gap-[10px]">
          <input
            type="text"
            placeholder="Search by name, email..."
            defaultValue={keyword}
            onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
            className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-full sm:w-[280px] focus:border-[#0088FF] outline-none bg-white placeholder:text-[#C4C9D4]"
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
          <select
            value={roleId}
            onChange={(e) => updateQuery({ roleId: e.target.value })}
            className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[12px] text-[14px] focus:border-[#0088FF] outline-none bg-white cursor-pointer"
          >
            <option value="">All Roles</option>
            <option value="none">No Role</option>
            {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="h-[38px] px-[18px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white text-[14px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] transition-all cursor-pointer shadow-sm"
        >
          + Create Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[900px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Name</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Email</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Status</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Role</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Joined</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialAccounts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-[64px]">
                    <div className="flex flex-col items-center gap-[10px] text-[#9CA3AF]">
                      <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center">
                        <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-[500] text-[#374151]">No accounts found</p>
                        <p className="text-[12px] mt-[2px]">Try adjusting your filters</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : initialAccounts.map((a) => {
                const cfg = statusConfig[a.status] || { label: a.status, className: "" };
                return (
                  <tr key={a._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-[16px] py-[13px]">
                      <div className="flex items-center gap-[6px]">
                        <span className="font-[500] text-[#111827] whitespace-nowrap">{a.fullName}</span>
                        {a.isSuperAdmin && (
                          <span className="shrink-0 px-[6px] py-[2px] rounded-full text-[10px] font-[600] bg-purple-100 text-purple-700 border border-purple-200">
                            Super Admin
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span className="text-[#6B7280] whitespace-nowrap">{a.email}</span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      <span className={`inline-flex items-center px-[8px] py-[3px] rounded-full text-[11.5px] font-[500] ${cfg.className}`}>
                        {cfg.label}
                      </span>
                    </td>
                    <td className="px-[16px] py-[13px]">
                      {a.isSuperAdmin ? (
                        <span className="text-[13px] text-purple-600 font-[500]">Super Admin</span>
                      ) : (
                        <select
                          defaultValue={a.role?._id || ""}
                          disabled={loading === a._id + "role"}
                          onChange={(e) => patchRole(a._id, e.target.value)}
                          className="h-[28px] w-full max-w-[130px] rounded-[6px] border border-[#E5E7EB] px-[8px] text-[12.5px] focus:border-[#0088FF] outline-none cursor-pointer bg-white"
                        >
                          <option value="">No Role</option>
                          {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                        </select>
                      )}
                    </td>
                    <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[13px] whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                    <td className="px-[16px] py-[13px]">
                      {a.isSuperAdmin ? (
                        <div className="flex justify-center">
                          <span className="text-[11.5px] text-[#C4C9D4] italic">Protected</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-[5px] flex-wrap">
                          <button
                            disabled={!!loading}
                            onClick={() => setEditAccount(a)}
                            className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                          >
                            <FaEdit className="text-[9px]" /> Edit
                          </button>
                          {a.status !== "active" && (
                            <button
                              disabled={!!loading}
                              onClick={() => patchStatus(a._id, "active")}
                              className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-green-400 text-green-600 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                            >
                              <FaCheck className="text-[9px]" /> Activate
                            </button>
                          )}
                          {a.status === "active" && (
                            <button
                              disabled={!!loading}
                              onClick={() => patchStatus(a._id, "inactive")}
                              className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-orange-300 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                            >
                              <FaBan className="text-[9px]" /> Deactivate
                            </button>
                          )}
                          <button
                            disabled={!!loading}
                            onClick={() => setConfirmDeleteId(a._id)}
                            className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap font-[500]"
                          >
                            <FaTrash className="text-[9px]" /> Delete
                          </button>
                        </div>
                      )}
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
        isOpen={!!confirmDeleteId}
        title="Delete Admin Account"
        message="Are you sure you want to delete this admin account? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deleteAccount}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Create/Edit Modals */}
      {showCreateModal && (
        <AccountModal
          mode="create"
          roles={roles}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => { setShowCreateModal(false); router.refresh(); }}
        />
      )}
      {editAccount && (
        <AccountModal
          mode="edit"
          account={editAccount}
          roles={roles}
          onClose={() => setEditAccount(null)}
          onSuccess={() => { setEditAccount(null); router.refresh(); }}
        />
      )}
    </div>
  );
};
