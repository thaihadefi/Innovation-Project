"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";
import { FaEdit, FaTrash, FaCheck, FaBan } from "react-icons/fa";
import {
  adminAccountCreateSchema,
  adminAccountEditSchema,
  type AdminAccountCreateFormData,
  type AdminAccountEditFormData,
} from "@/schemas/admin.schema";

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

  // Create form
  const createForm = useForm<AdminAccountCreateFormData>({
    resolver: zodResolver(adminAccountCreateSchema),
    defaultValues: { fullName: "", email: "", password: "", phone: "", roleId: "" },
  });

  // Edit form
  const editForm = useForm<AdminAccountEditFormData>({
    resolver: zodResolver(adminAccountEditSchema),
    defaultValues: { fullName: "", email: "", password: "", phone: "", roleId: "" },
  });

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

  const submitCreate = async (data: AdminAccountCreateFormData) => {
    setLoading("create");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName,
          email: data.email,
          password: data.password,
          phone: data.phone || undefined,
          roleId: data.roleId || undefined,
        }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else {
        toast.success(result.message);
        setShowCreateModal(false);
        createForm.reset();
        router.refresh();
      }
    } catch { toast.error("Network error."); } finally { setLoading(null); }
  };

  const openEdit = (account: Account) => {
    setEditAccount(account);
    editForm.reset({
      fullName: account.fullName,
      email: account.email,
      password: "",
      phone: (account as any).phone || "",
      roleId: account.role?._id || "",
    });
  };

  const submitEdit = async (data: AdminAccountEditFormData) => {
    if (!editAccount) return;
    setLoading("edit");
    try {
      const body: any = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        roleId: data.roleId || undefined,
      };
      if (data.password) body.password = data.password;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts/${editAccount._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else {
        toast.success(result.message);
        setEditAccount(null);
        editForm.reset();
        router.refresh();
      }
    } catch { toast.error("Network error."); } finally { setLoading(null); }
  };

  const statusColors: Record<string, string> = {
    initial: "bg-yellow-100 text-yellow-700",
    active: "bg-green-100 text-green-700",
    inactive: "bg-red-100 text-red-600",
  };

  const fmtDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  // Close modals on Escape
  useEffect(() => {
    if (!showCreateModal && !editAccount) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") { setShowCreateModal(false); setEditAccount(null); }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showCreateModal, editAccount]);

  const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
    <div>
      <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">{label}</label>
      {children}
      {error && <p className="text-[12px] text-red-500 mt-[4px]">{error}</p>}
    </div>
  );

  const inputClass = (hasError: boolean) =>
    `w-full h-[40px] rounded-[8px] border px-[14px] text-[14px] outline-none transition-colors ${hasError ? "border-red-400 focus:border-red-500" : "border-[#DEDEDE] focus:border-[#0088FF]"}`;

  return (
    <div>
      {/* Filters + Create button */}
      <div className="flex flex-wrap gap-[12px] mb-[20px] items-center justify-between">
        <div className="flex flex-wrap gap-[12px]">
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
          <select value={roleId} onChange={(e) => updateQuery({ roleId: e.target.value })}
            className="h-[38px] rounded-[8px] border border-[#DEDEDE] px-[12px] text-[14px] focus:border-[#0088FF] outline-none">
            <option value="">All Roles</option>
            <option value="none">No Role</option>
            {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
          </select>
        </div>
        <button onClick={() => { setShowCreateModal(true); createForm.reset(); }}
          className="h-[38px] px-[16px] rounded-[8px] bg-[#0088FF] text-white text-[14px] font-[500] hover:bg-[#006FCC] transition-all cursor-pointer">
          + Create Admin
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[12px] shadow-sm border border-[#E8E8E8] overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Name</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Email</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Status</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Role</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Joined</th>
              <th className="text-center px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialAccounts.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-[56px]">
                  <div className="flex flex-col items-center gap-[8px] text-[#9CA3AF]">
                    <svg className="w-[32px] h-[32px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    <p className="text-[14px] font-[500]">No accounts found</p>
                    <p className="text-[12px]">Try adjusting your filters</p>
                  </div>
                </td>
              </tr>
            ) : initialAccounts.map((a) => (
              <tr key={a._id} className="border-b border-[#F9F9F9] hover:bg-[#FAFAFA]">
                <td className="px-[16px] py-[12px] font-[500] whitespace-nowrap">
                  {a.fullName}
                  {a.isSuperAdmin && (
                    <span className="ml-[6px] px-[6px] py-[1px] rounded-full text-[10px] font-[600] bg-purple-100 text-purple-700">
                      Super Admin
                    </span>
                  )}
                </td>
                <td className="px-[16px] py-[12px] text-[#666] whitespace-nowrap">
                  {a.email}
                </td>
                <td className="px-[16px] py-[12px]">
                  <span className={`px-[8px] py-[2px] rounded-full text-[12px] font-[500] whitespace-nowrap ${statusColors[a.status] || ""}`}>
                    {a.status === "initial" ? "Pending" : a.status}
                  </span>
                </td>
                <td className="px-[16px] py-[12px]">
                  {a.isSuperAdmin ? (
                    <span className="text-[13px] text-purple-600 font-[500]">Super Admin</span>
                  ) : (
                    <select
                      defaultValue={a.role?._id || ""}
                      disabled={loading === a._id + "role"}
                      onChange={(e) => patchRole(a._id, e.target.value)}
                      className="h-[28px] w-full max-w-[120px] rounded-[6px] border border-[#DEDEDE] px-[8px] text-[13px] focus:border-[#0088FF] outline-none cursor-pointer">
                      <option value="">No Role</option>
                      {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-[16px] py-[12px] text-[#999] text-[13px] whitespace-nowrap">{fmtDate(a.createdAt)}</td>
                <td className="px-[16px] py-[12px]">
                  {a.isSuperAdmin ? (
                    <span className="text-[12px] text-[#9CA3AF]">Protected</span>
                  ) : (
                  <div className="flex items-center justify-center gap-[6px] flex-wrap">
                    <button onClick={() => openEdit(a)}
                      className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all cursor-pointer whitespace-nowrap">
                      <FaEdit className="text-[10px]" /> Edit
                    </button>
                    {a.status !== "active" && (
                      <button disabled={!!loading}
                        onClick={() => patchStatus(a._id, "active")}
                        className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-green-500 text-green-600 hover:bg-green-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                        <FaCheck className="text-[10px]" /> Activate
                      </button>
                    )}
                    {a.status === "active" && (
                      <button disabled={!!loading}
                        onClick={() => patchStatus(a._id, "inactive")}
                        className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-orange-400 text-orange-500 hover:bg-orange-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                        <FaBan className="text-[10px]" /> Deactivate
                      </button>
                    )}
                    <button disabled={!!loading}
                      onClick={() => setConfirmDeleteId(a._id)}
                      className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap">
                      <FaTrash className="text-[10px]" /> Delete
                    </button>
                  </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
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
        title="Delete Admin Account"
        message="Are you sure you want to delete this admin account? This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deleteAccount}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowCreateModal(false)}>
          <div className="bg-white rounded-[12px] w-full max-w-[480px] mx-[16px] p-[32px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-[700] text-[18px] text-[#121212] mb-[20px]">Create Admin Account</h2>
            <form onSubmit={createForm.handleSubmit(submitCreate)} className="flex flex-col gap-[14px]">
              <FormField label="Full Name *" error={createForm.formState.errors.fullName?.message}>
                <input {...createForm.register("fullName")} className={inputClass(!!createForm.formState.errors.fullName)} placeholder="John Doe" />
              </FormField>
              <FormField label="Email *" error={createForm.formState.errors.email?.message}>
                <input {...createForm.register("email")} type="email" className={inputClass(!!createForm.formState.errors.email)} placeholder="admin@example.com" />
              </FormField>
              <FormField label="Password *" error={createForm.formState.errors.password?.message}>
                <input {...createForm.register("password")} type="password" className={inputClass(!!createForm.formState.errors.password)} placeholder="Min 8 chars, uppercase, lowercase, digit, special" />
              </FormField>
              <FormField label="Phone" error={createForm.formState.errors.phone?.message}>
                <input {...createForm.register("phone")} className={inputClass(!!createForm.formState.errors.phone)} placeholder="Optional" />
              </FormField>
              <FormField label="Role">
                <select {...createForm.register("roleId")} className={inputClass(false)}>
                  <option value="">No Role</option>
                  {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
              </FormField>
              <div className="flex gap-[12px] mt-[8px]">
                <button type="button" onClick={() => { setShowCreateModal(false); createForm.reset(); }}
                  className="flex-1 h-[40px] rounded-[8px] border border-[#DEDEDE] text-[14px] text-[#666] hover:bg-[#F5F7FA] transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading === "create"}
                  className="flex-1 h-[40px] rounded-[8px] bg-[#0088FF] text-white text-[14px] font-[500] hover:bg-[#006FCC] transition-all cursor-pointer disabled:opacity-50">
                  {loading === "create" ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {editAccount && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setEditAccount(null)}>
          <div className="bg-white rounded-[12px] w-full max-w-[480px] mx-[16px] p-[32px] max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-[700] text-[18px] text-[#121212] mb-[20px]">Edit Admin Account</h2>
            <form onSubmit={editForm.handleSubmit(submitEdit)} className="flex flex-col gap-[14px]">
              <FormField label="Full Name *" error={editForm.formState.errors.fullName?.message}>
                <input {...editForm.register("fullName")} className={inputClass(!!editForm.formState.errors.fullName)} />
              </FormField>
              <FormField label="Email *" error={editForm.formState.errors.email?.message}>
                <input {...editForm.register("email")} type="email" className={inputClass(!!editForm.formState.errors.email)} />
              </FormField>
              <FormField label="Password (leave blank to keep)" error={editForm.formState.errors.password?.message}>
                <input {...editForm.register("password")} type="password" className={inputClass(!!editForm.formState.errors.password)} placeholder="Leave blank to keep current" />
              </FormField>
              <FormField label="Phone" error={editForm.formState.errors.phone?.message}>
                <input {...editForm.register("phone")} className={inputClass(!!editForm.formState.errors.phone)} />
              </FormField>
              <FormField label="Role">
                <select {...editForm.register("roleId")} className={inputClass(false)}>
                  <option value="">No Role</option>
                  {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
                </select>
              </FormField>
              <div className="flex gap-[12px] mt-[8px]">
                <button type="button" onClick={() => setEditAccount(null)}
                  className="flex-1 h-[40px] rounded-[8px] border border-[#DEDEDE] text-[14px] text-[#666] hover:bg-[#F5F7FA] transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading === "edit"}
                  className="flex-1 h-[40px] rounded-[8px] bg-[#0088FF] text-white text-[14px] font-[500] hover:bg-[#006FCC] transition-all cursor-pointer disabled:opacity-50">
                  {loading === "edit" ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
