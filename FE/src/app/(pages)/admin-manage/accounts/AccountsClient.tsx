"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";
import { Pagination } from "@/app/components/pagination/Pagination";
import { FaEdit, FaTrash, FaCheck, FaBan } from "react-icons/fa";
import { AccountModal } from "./AccountModal";
import { formatDateVN as fmtDate } from "@/utils/date";
import { accountStatusConfig as statusConfig } from "@/configs/variable";
import { EmptyTableState } from "@/app/components/table/EmptyTableState";
import { useAdminListQuery } from "@/hooks/useAdminListQuery";
import type { PaginationMeta } from "@/types/pagination";

export type Account = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  status: string;
  isSuperAdmin?: boolean;
  role: { _id: string; name: string } | null;
  createdAt: string;
};

export type Role = { _id: string; name: string };

export const AccountsClient = ({
  initialAccounts,
  initialPagination,
  roles,
}: {
  initialAccounts: Account[];
  initialPagination: PaginationMeta | null;
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
  const { page, updateQuery, setPage } = useAdminListQuery();

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

  const deleteAccount = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setLoading(id + "delete");
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") {
        toast.error(result.message);
      } else {
        toast.success(result.message || "Account deleted.");
        router.refresh();
      }
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setLoading(null);
    }
  };

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
                <EmptyTableState
                  colSpan={6}
                  title="No accounts found"
                  subtitle="Try adjusting your filters"
                  icon={
                    <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                  }
                />
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

      
      {initialPagination && (
        <Pagination
          currentPage={page}
          totalPage={initialPagination.totalPage}
          onPageChange={setPage}
        />
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
