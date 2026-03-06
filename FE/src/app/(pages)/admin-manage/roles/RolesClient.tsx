"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

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
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", permissions: [] as string[] });

  const resetForm = () => setForm({ name: "", description: "", permissions: [] });

  const togglePerm = (perm: string) => {
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(perm) ? f.permissions.filter((p) => p !== perm) : [...f.permissions, perm],
    }));
  };

  const createRole = async () => {
    if (!form.name.trim()) { toast.error("Role name is required."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success("Role created."); setShowCreate(false); resetForm(); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  const updateRole = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success("Role updated."); setEditId(null); resetForm(); router.refresh(); }
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  const deleteRole = async (id: string) => {
    if (!confirm("Delete this role?")) return;
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

  const startEdit = (role: Role) => {
    setEditId(role._id);
    setForm({ name: role.name, description: role.description || "", permissions: [...role.permissions] });
    setShowCreate(false);
  };

  const PermCheckboxes = () => (
    <div className="grid grid-cols-2 gap-[6px] mt-[8px]">
      {allPermissions.map((perm) => (
        <label key={perm} className="flex items-center gap-[6px] text-[13px] cursor-pointer">
          <input type="checkbox" checked={form.permissions.includes(perm)} onChange={() => togglePerm(perm)}
            className="w-[14px] h-[14px]" />
          {perm}
        </label>
      ))}
    </div>
  );

  return (
    <div>
      <div className="mb-[16px]">
        <button onClick={() => { setShowCreate(!showCreate); setEditId(null); resetForm(); }}
          className="px-[16px] py-[8px] rounded-[8px] bg-[#0088FF] text-white text-[14px] font-[500] hover:bg-[#0077EE] cursor-pointer transition-all">
          {showCreate ? "Cancel" : "+ New Role"}
        </button>
      </div>

      {showCreate && (
        <div className="bg-white rounded-[12px] p-[20px] shadow-sm border border-[#E8E8E8] mb-[20px]">
          <h3 className="font-[600] text-[16px] mb-[12px]">Create Role</h3>
          <div className="grid grid-cols-1 gap-[10px]">
            <input type="text" placeholder="Role name *" value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="h-[40px] rounded-[8px] border border-[#DEDEDE] px-[12px] text-[14px] focus:border-[#0088FF] outline-none" />
            <input type="text" placeholder="Description (optional)" value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="h-[40px] rounded-[8px] border border-[#DEDEDE] px-[12px] text-[14px] focus:border-[#0088FF] outline-none" />
            <div><p className="text-[13px] font-[500] text-[#666]">Permissions:</p><PermCheckboxes /></div>
            <button onClick={createRole} disabled={loading}
              className="h-[40px] rounded-[8px] bg-[#0088FF] text-white text-[14px] font-[500] hover:bg-[#0077EE] cursor-pointer disabled:opacity-50 transition-all">
              Create
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-[12px]">
        {initialRoles.length === 0 ? (
          <div className="text-center py-[40px] text-[#999] bg-white rounded-[12px] border border-[#E8E8E8]">No roles yet.</div>
        ) : initialRoles.map((role) => (
          <div key={role._id} className="bg-white rounded-[12px] p-[20px] shadow-sm border border-[#E8E8E8]">
            {editId === role._id ? (
              <div className="grid grid-cols-1 gap-[10px]">
                <input type="text" value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="h-[40px] rounded-[8px] border border-[#DEDEDE] px-[12px] text-[14px] focus:border-[#0088FF] outline-none" />
                <input type="text" value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="h-[40px] rounded-[8px] border border-[#DEDEDE] px-[12px] text-[14px] focus:border-[#0088FF] outline-none" />
                <div><p className="text-[13px] font-[500] text-[#666]">Permissions:</p><PermCheckboxes /></div>
                <div className="flex gap-[8px]">
                  <button onClick={() => updateRole(role._id)} disabled={loading}
                    className="px-[16px] py-[8px] rounded-[8px] bg-[#0088FF] text-white text-[13px] font-[500] hover:bg-[#0077EE] cursor-pointer disabled:opacity-50">
                    Save
                  </button>
                  <button onClick={() => { setEditId(null); resetForm(); }}
                    className="px-[16px] py-[8px] rounded-[8px] border border-[#DEDEDE] text-[13px] text-[#666] hover:border-[#999] cursor-pointer">
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-[16px]">
                <div className="flex-1">
                  <p className="font-[600] text-[16px] text-[#121212]">{role.name}</p>
                  {role.description && <p className="text-[13px] text-[#666] mt-[2px]">{role.description}</p>}
                  <div className="flex flex-wrap gap-[6px] mt-[10px]">
                    {role.permissions.length === 0
                      ? <span className="text-[12px] text-[#999]">No permissions</span>
                      : role.permissions.map((p) => (
                        <span key={p} className="px-[8px] py-[2px] bg-[#EEF6FF] text-[#0088FF] rounded-full text-[11px] font-[500]">{p}</span>
                      ))}
                  </div>
                </div>
                <div className="flex gap-[8px] shrink-0">
                  <button onClick={() => startEdit(role)}
                    className="text-[12px] px-[10px] py-[4px] rounded-[6px] border border-[#0088FF] text-[#0088FF] hover:bg-[#0088FF] hover:text-white transition-all cursor-pointer">
                    Edit
                  </button>
                  <button onClick={() => deleteRole(role._id)} disabled={loading}
                    className="text-[12px] px-[10px] py-[4px] rounded-[6px] border border-red-400 text-red-500 hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50">
                    Delete
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
