"use client";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { toast } from "sonner";
import { FaTimes } from "react-icons/fa";
import {
  adminAccountCreateSchema,
  adminAccountEditSchema,
  type AdminAccountCreateFormData,
  type AdminAccountEditFormData,
} from "@/schemas/admin.schema";

type Role = { _id: string; name: string };
type Account = {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: { _id: string; name: string } | null;
};

type Props =
  | { mode: "create"; roles: Role[]; onClose: () => void; onSuccess: () => void; account?: never }
  | { mode: "edit"; roles: Role[]; account: Account; onClose: () => void; onSuccess: () => void };

const inputClass = (hasError: boolean) =>
  `w-full h-[42px] rounded-[8px] border px-[14px] text-[14px] outline-none transition-colors bg-white ${
    hasError ? "border-red-400 focus:border-red-500 bg-red-50/30" : "border-[#E5E7EB] focus:border-[#0088FF]"
  }`;

const FormField = ({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) => (
  <div>
    <label className="text-[12.5px] font-[600] text-[#374151] mb-[6px] block uppercase tracking-[0.4px]">{label}</label>
    {children}
    {error && <p className="text-[12px] text-red-500 mt-[4px]">{error}</p>}
  </div>
);

export const AccountModal = ({ mode, roles, account, onClose, onSuccess }: Props) => {
  const [loading, setLoading] = useState(false);

  const createForm = useForm<AdminAccountCreateFormData>({
    resolver: zodResolver(adminAccountCreateSchema),
    defaultValues: { fullName: "", email: "", password: "", phone: "", roleId: "" },
  });

  const editForm = useForm<AdminAccountEditFormData>({
    resolver: zodResolver(adminAccountEditSchema),
    defaultValues: {
      fullName: account?.fullName || "",
      email: account?.email || "",
      password: "",
      phone: (account as any)?.phone || "",
      roleId: account?.role?._id || "",
    },
  });

  const submitCreate = async (data: AdminAccountCreateFormData) => {
    setLoading(true);
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
      else { toast.success(result.message); onSuccess(); }
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  const submitEdit = async (data: AdminAccountEditFormData) => {
    if (!account) return;
    setLoading(true);
    try {
      const body: Record<string, unknown> = {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone || undefined,
        roleId: data.roleId || undefined,
      };
      if (data.password) body.password = data.password;
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts/${account._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else { toast.success(result.message); onSuccess(); }
    } catch { toast.error("Network error."); } finally { setLoading(false); }
  };

  const isCreate = mode === "create";
  const form = isCreate ? createForm : editForm;
  const onSubmit = isCreate ? createForm.handleSubmit(submitCreate) : editForm.handleSubmit(submitEdit);
  const errors = form.formState.errors;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-[16px]" onClick={onClose}>
      <div
        className="bg-white rounded-[16px] w-full max-w-[480px] shadow-[0_20px_60px_rgba(0,0,0,0.15)] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[28px] py-[20px] border-b border-[#F0F2F5]">
          <div>
            <h2 className="font-[700] text-[17px] text-[#111827]">
              {isCreate ? "Create Admin Account" : "Edit Admin Account"}
            </h2>
            <p className="text-[12px] text-[#9CA3AF] mt-[2px]">
              {isCreate ? "Set up a new administrator account" : "Update account details"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-[32px] h-[32px] rounded-full bg-[#F3F4F6] hover:bg-[#E5E7EB] flex items-center justify-center transition-colors cursor-pointer"
          >
            <FaTimes className="text-[12px] text-[#6B7280]" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={onSubmit} className="px-[28px] py-[24px] flex flex-col gap-[16px]">
          <FormField label="Full Name *" error={errors.fullName?.message}>
            <input
              {...(isCreate ? createForm.register("fullName") : editForm.register("fullName"))}
              className={inputClass(!!errors.fullName)}
              placeholder="John Doe"
            />
          </FormField>
          <FormField label="Email *" error={errors.email?.message}>
            <input
              {...(isCreate ? createForm.register("email") : editForm.register("email"))}
              type="email"
              className={inputClass(!!errors.email)}
              placeholder="admin@example.com"
            />
          </FormField>
          <FormField
            label={isCreate ? "Password *" : "Password (leave blank to keep)"}
            error={errors.password?.message}
          >
            <input
              {...(isCreate ? createForm.register("password") : editForm.register("password"))}
              type="text"
              className={inputClass(!!errors.password)}
              placeholder={isCreate ? "Min 8 chars, uppercase, lowercase, digit, special" : "Leave blank to keep current"}
            />
          </FormField>
          <FormField label="Phone" error={errors.phone?.message}>
            <input
              {...(isCreate ? createForm.register("phone") : editForm.register("phone"))}
              className={inputClass(!!errors.phone)}
              placeholder="Optional"
            />
          </FormField>
          <FormField label="Role">
            <select
              {...(isCreate ? createForm.register("roleId") : editForm.register("roleId"))}
              className={inputClass(false)}
            >
              <option value="">No Role</option>
              {roles.map((r) => <option key={r._id} value={r._id}>{r.name}</option>)}
            </select>
          </FormField>

          {/* Actions */}
          <div className="flex gap-[12px] pt-[4px]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[42px] rounded-[8px] border border-[#E5E7EB] text-[14px] text-[#6B7280] hover:bg-[#F5F7FA] transition-all cursor-pointer font-[500]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 h-[42px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white text-[14px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] transition-all cursor-pointer disabled:opacity-50 shadow-sm"
            >
              {loading ? (isCreate ? "Creating..." : "Saving...") : (isCreate ? "Create Account" : "Save Changes")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
