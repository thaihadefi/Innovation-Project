"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";
import { roleFormSchema, type RoleFormData } from "@/schemas/admin.schema";
import { FaEdit, FaTrash } from "react-icons/fa";

const fmtDate = (d: string) => new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

type Role = { _id: string; name: string; description?: string; permissions: string[]; createdAt: string };

export const RolesClient = ({
  initialRoles,
  allPermissions,
}: {
  initialRoles: Role[];
  allPermissions: string[];
}) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

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

  // Close modal on Escape
  useEffect(() => {
    if (!showModal) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeModal(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showModal]);

  return (
    <div>
      <div className="mb-[16px]">
        <button onClick={openCreate}
          className="px-[16px] py-[8px] rounded-[8px] bg-[#0088FF] text-white text-[14px] font-[500] hover:bg-[#0077EE] cursor-pointer transition-all">
          + New Role
        </button>
      </div>

      {/* Roles Table */}
      <div className="bg-white rounded-[12px] shadow-sm border border-[#E8E8E8] overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="border-b border-[#F0F0F0] bg-[#FAFAFA]">
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Name</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Description</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Permissions</th>
              <th className="text-left px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Created</th>
              <th className="text-center px-[16px] py-[12px] font-[600] text-[11.5px] uppercase tracking-[0.4px] text-[#6B7280] whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {initialRoles.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-[56px]">
                  <div className="flex flex-col items-center gap-[8px] text-[#9CA3AF]">
                    <svg className="w-[32px] h-[32px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <p className="text-[14px] font-[500]">No roles yet</p>
                    <p className="text-[12px]">Create one to get started</p>
                  </div>
                </td>
              </tr>
            ) : initialRoles.map((role) => (
              <tr key={role._id} className="border-b border-[#F9F9F9] hover:bg-[#FAFAFA]">
                <td className="px-[16px] py-[12px] font-[500] text-[#111827] whitespace-nowrap">
                  {role.name}
                </td>
                <td className="px-[16px] py-[12px] text-[#666] whitespace-nowrap">
                  {role.description || <span className="text-[#CCC]">—</span>}
                </td>
                <td className="px-[16px] py-[12px]">
                  {role.permissions.length === 0
                    ? <span className="text-[12px] text-[#999]">No permissions</span>
                    : (
                      <div className="flex flex-wrap gap-[4px]">
                        {role.permissions.map((p) => (
                          <span key={p} className="px-[6px] py-[1px] bg-[#EEF6FF] text-[#0088FF] rounded-full text-[11px] font-[500] whitespace-nowrap">{p}</span>
                        ))}
                      </div>
                    )}
                </td>
                <td className="px-[16px] py-[12px] text-[#999] text-[13px] whitespace-nowrap">
                  {fmtDate(role.createdAt)}
                </td>
                <td className="px-[16px] py-[12px]">
                  <div className="flex items-center justify-center gap-[6px]">
                    <button onClick={() => openEdit(role)}
                      className="inline-flex items-center gap-[4px] text-[12px] h-[28px] px-[10px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all cursor-pointer whitespace-nowrap">
                      <FaEdit className="text-[10px]" /> Edit
                    </button>
                    <button onClick={() => setConfirmDeleteId(role._id)} disabled={loading}
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

      {/* Create / Edit Role Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-white rounded-[12px] w-full max-w-[520px] mx-[16px] p-[32px] shadow-xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            <h2 className="font-[700] text-[18px] text-[#121212] mb-[20px]">
              {editId ? "Edit Role" : "Create Role"}
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[14px]">
              <div>
                <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Role Name *</label>
                <input {...register("name")}
                  className={`w-full h-[40px] rounded-[8px] border px-[14px] text-[14px] outline-none transition-colors ${errors.name ? "border-red-400 focus:border-red-500" : "border-[#DEDEDE] focus:border-[#0088FF]"}`}
                  placeholder="e.g. Content Moderator" />
                {errors.name && <p className="text-[12px] text-red-500 mt-[4px]">{errors.name.message}</p>}
              </div>
              <div>
                <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Description</label>
                <input {...register("description")}
                  className={`w-full h-[40px] rounded-[8px] border px-[14px] text-[14px] outline-none transition-colors ${errors.description ? "border-red-400 focus:border-red-500" : "border-[#DEDEDE] focus:border-[#0088FF]"}`}
                  placeholder="Optional description" />
                {errors.description && <p className="text-[12px] text-red-500 mt-[4px]">{errors.description.message}</p>}
              </div>
              <div>
                <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Permissions</label>
                <div className="grid grid-cols-2 gap-[6px] mt-[4px]">
                  {allPermissions.map((perm) => (
                    <label key={perm} className="flex items-center gap-[6px] text-[13px] cursor-pointer select-none hover:bg-[#F5F7FA] rounded-[4px] px-[4px] py-[2px]">
                      <input type="checkbox" checked={(permissions || []).includes(perm)} onChange={() => togglePerm(perm)}
                        className="w-[14px] h-[14px] accent-[#0088FF]" />
                      {perm}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-[12px] mt-[8px]">
                <button type="button" onClick={closeModal}
                  className="flex-1 h-[40px] rounded-[8px] border border-[#DEDEDE] text-[14px] text-[#666] hover:bg-[#F5F7FA] transition-all cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={loading}
                  className="flex-1 h-[40px] rounded-[8px] bg-[#0088FF] text-white text-[14px] font-[500] hover:bg-[#006FCC] transition-all cursor-pointer disabled:opacity-50">
                  {loading ? (editId ? "Saving..." : "Creating...") : (editId ? "Save Changes" : "Create")}
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
