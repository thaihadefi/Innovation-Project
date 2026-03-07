"use client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";
import { roleFormSchema, type RoleFormData } from "@/schemas/admin.schema";
import { FaEdit, FaTrash, FaTimes } from "react-icons/fa";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

type Role = { _id: string; name: string; description?: string; permissions: string[]; createdAt: string };
type Pagination = { totalRecord: number; totalPage: number; currentPage: number; pageSize: number };

export const RolesClient = ({
  initialRoles,
  allPermissions,
  initialPagination,
}: {
  initialRoles: Role[];
  allPermissions: string[];
  initialPagination: Pagination | null;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const keyword = searchParams.get("keyword") || "";
  const page = searchParams.get("page") || "1";

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => {
      if (v) params.set(k, v); else params.delete(k);
    });
    params.delete("page");
    router.push(`/admin-manage/roles?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`/admin-manage/roles?${params.toString()}`);
  };

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<RoleFormData>({
    resolver: zodResolver(roleFormSchema),
    defaultValues: { name: "", description: "", permissions: [] },
  });

  const permissions = watch("permissions");

  const togglePerm = (perm: string) => {
    const current = permissions || [];
    setValue("permissions", current.includes(perm) ? current.filter((p) => p !== perm) : [...current, perm], { shouldValidate: true });
  };

  const openCreate = () => {
    reset({ name: "", description: "", permissions: [] });
    setEditId(null);
    setShowModal(true);
  };

  const openEdit = (role: Role) => {
    reset({ name: role.name, description: role.description || "", permissions: [...role.permissions] });
    setEditId(role._id);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditId(null);
    reset({ name: "", description: "", permissions: [] });
  };

  const onSubmit = async (data: RoleFormData) => {
    setLoading(true);
    try {
      const url = editId
        ? `${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${editId}`
        : `${process.env.NEXT_PUBLIC_API_URL}/admin/roles`;
      const res = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else {
        toast.success(editId ? "Role updated." : "Role created.");
        closeModal();
        router.refresh();
      }
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  const deleteRole = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success("Role deleted."); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showModal]);

  return (
    <div>
      {/* Filters + Create */}
      <div className="flex flex-wrap gap-[10px] mb-[20px] items-center justify-between">
        <input
          type="text"
          placeholder="Search by name..."
          defaultValue={keyword}
          onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
          className="h-[38px] rounded-[8px] border border-[#E5E7EB] px-[14px] text-[14px] w-full sm:w-[280px] focus:border-[#0088FF] outline-none bg-white transition-colors placeholder:text-[#C4C9D4]"
        />
        <button
          onClick={openCreate}
          className="h-[38px] px-[18px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white text-[14px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] cursor-pointer transition-all shadow-sm"
        >
          + New Role
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[14px] min-w-[700px]">
            <thead>
              <tr className="border-b border-[#F0F2F5] bg-[#F8FAFC]">
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Name</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Description</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Permissions</th>
                <th className="text-left px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Created</th>
                <th className="text-center px-[16px] py-[13px] font-[600] text-[11px] uppercase tracking-[0.8px] text-[#6B7280]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {initialRoles.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-[64px]">
                    <div className="flex flex-col items-center gap-[10px] text-[#9CA3AF]">
                      <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center">
                        <svg className="w-[24px] h-[24px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[14px] font-[500] text-[#374151]">{keyword ? "No roles match your search" : "No roles yet"}</p>
                        <p className="text-[12px] mt-[2px]">{keyword ? "Try a different keyword" : "Create one to get started"}</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : initialRoles.map((role) => (
                <tr key={role._id} className="border-b border-[#F5F6F8] hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-[16px] py-[13px] font-[600] text-[#111827]">{role.name}</td>
                  <td className="px-[16px] py-[13px] text-[#6B7280]">
                    {role.description || <span className="text-[#D1D5DB]">—</span>}
                  </td>
                  <td className="px-[16px] py-[13px]">
                    {role.permissions.length === 0 ? (
                      <span className="text-[12px] text-[#C4C9D4] italic">No permissions</span>
                    ) : (
                      <div className="flex flex-wrap gap-[4px]">
                        {role.permissions.map((p) => (
                          <span key={p} className="px-[6px] py-[2px] bg-[#EEF6FF] text-[#0088FF] rounded-full text-[11px] font-[500]">{p}</span>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-[16px] py-[13px] text-[#9CA3AF] text-[13px] whitespace-nowrap">{fmtDate(role.createdAt)}</td>
                  <td className="px-[16px] py-[13px]">
                    <div className="flex items-center justify-center gap-[5px]">
                      <button
                        onClick={() => openEdit(role)}
                        className="inline-flex items-center gap-[4px] text-[11.5px] h-[28px] px-[10px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all cursor-pointer whitespace-nowrap font-[500]"
                      >
                        <FaEdit className="text-[9px]" /> Edit
                      </button>
                      <button
                        onClick={() => setConfirmDeleteId(role._id)}
                        disabled={loading}
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

      {/* Create / Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[16px]" onClick={closeModal}>
          <div
            className="bg-white rounded-[16px] w-full max-w-[520px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-center justify-between px-[28px] py-[20px] border-b border-[#F0F2F5]">
              <div>
                <h2 className="font-[700] text-[17px] text-[#111827]">{editId ? "Edit Role" : "Create Role"}</h2>
                <p className="text-[12px] text-[#9CA3AF] mt-[2px]">{editId ? "Update role details and permissions" : "Define a new admin role with permissions"}</p>
              </div>
              <button onClick={closeModal} className="w-[32px] h-[32px] rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors cursor-pointer">
                <FaTimes className="text-[12px] text-[#6B7280]" />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit(onSubmit)} className="px-[28px] py-[24px] flex flex-col gap-[16px]">
              <div>
                <label className="text-[12.5px] font-[600] text-[#374151] mb-[6px] block uppercase tracking-[0.4px]">Role Name <span className="text-red-500">*</span></label>
                <input
                  {...register("name")}
                  className={`w-full h-[42px] rounded-[8px] border px-[14px] text-[14px] outline-none transition-colors ${errors.name ? "border-red-400 focus:border-red-500 bg-red-50/30" : "border-[#E5E7EB] focus:border-[#0088FF] bg-white"}`}
                  placeholder="e.g. Content Moderator"
                />
                {errors.name && <p className="text-[12px] text-red-500 mt-[4px]">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-[12.5px] font-[600] text-[#374151] mb-[6px] block uppercase tracking-[0.4px]">Description</label>
                <input
                  {...register("description")}
                  className={`w-full h-[42px] rounded-[8px] border px-[14px] text-[14px] outline-none transition-colors ${errors.description ? "border-red-400 focus:border-red-500" : "border-[#E5E7EB] focus:border-[#0088FF] bg-white"}`}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className="text-[12.5px] font-[600] text-[#374151] mb-[8px] block uppercase tracking-[0.4px]">Permissions</label>
                <div className="border border-[#E5E7EB] rounded-[10px] p-[14px] bg-[#FAFBFC]">
                  <div className="grid grid-cols-2 gap-[6px]">
                    {allPermissions.map((perm) => (
                      <label key={perm} className="flex items-center gap-[8px] text-[13px] cursor-pointer select-none hover:bg-white rounded-[6px] px-[8px] py-[5px] transition-colors">
                        <input
                          type="checkbox"
                          checked={(permissions || []).includes(perm)}
                          onChange={() => togglePerm(perm)}
                          className="w-[14px] h-[14px] accent-[#0088FF] shrink-0"
                        />
                        <span className="text-[#374151]">{perm}</span>
                      </label>
                    ))}
                  </div>
                </div>
                {(permissions || []).length > 0 && (
                  <p className="text-[11.5px] text-[#0088FF] mt-[6px] font-[500]">{(permissions || []).length} permission{(permissions || []).length !== 1 ? "s" : ""} selected</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-[12px] pt-[4px]">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 h-[42px] rounded-[8px] border border-[#E5E7EB] text-[14px] text-[#6B7280] hover:bg-[#F5F7FA] transition-all cursor-pointer font-[500]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 h-[42px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white text-[14px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                >
                  {loading ? (editId ? "Saving..." : "Creating...") : (editId ? "Save Changes" : "Create Role")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={!!confirmDeleteId}
        title="Delete Role"
        message="Are you sure you want to delete this role? Admins assigned to it will lose their permissions."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={deleteRole}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};
