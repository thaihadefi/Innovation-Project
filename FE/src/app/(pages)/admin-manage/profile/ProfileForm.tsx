"use client";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Toaster, toast } from "sonner";
import { adminProfileSchema, type AdminProfileFormData } from "@/schemas/profile.schema";

type AdminInfo = {
  fullName: string;
  email: string;
  phone?: string;
  role?: { name: string } | null;
  status: string;
};

export const ProfileForm = ({ initialInfo }: { initialInfo: AdminInfo | null }) => {
  const router = useRouter();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AdminProfileFormData>({
    resolver: zodResolver(adminProfileSchema),
    defaultValues: {
      fullName: initialInfo?.fullName || "",
      phone: initialInfo?.phone || "",
    },
  });

  const onSubmit = async (data: AdminProfileFormData) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: data.fullName, phone: data.phone || "" }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") toast.error(result.message);
      else {
        toast.success(result.message || "Update successful.");
        router.refresh();
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };


  return (
    <>
      <Toaster richColors position="top-right" />
      {initialInfo && (
        <form
          className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]"
          onSubmit={handleSubmit(onSubmit, (errs) => {
            const firstError = Object.values(errs)[0];
            if (firstError?.message) toast.error(firstError.message as string);
          })}
        >
          {/* Full Name */}
          <div className="sm:col-span-2">
            <label htmlFor="fullName" className="block font-[500] text-[14px] text-black mb-[5px]">Full Name *</label>
            <input
              type="text"
              id="fullName"
              autoComplete="name"
              className="w-full h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("fullName")}
            />
            {errors.fullName && <p className="text-red-500 text-[12px] mt-[4px]">{errors.fullName.message}</p>}
          </div>

          {/* Email (read-only) */}
          <div>
            <label htmlFor="email" className="block font-[500] text-[14px] text-black mb-[5px]">Email</label>
            <input
              type="email"
              id="email"
              autoComplete="email"
              className="w-full h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-gray-400 bg-gray-50 cursor-not-allowed"
              defaultValue={initialInfo.email}
              disabled
            />
            <p className="text-[#999] text-[12px] mt-[4px]">Email cannot be changed.</p>
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block font-[500] text-[14px] text-black mb-[5px]">Phone Number</label>
            <input
              type="text"
              id="phone"
              autoComplete="tel"
              placeholder="e.g., 0901234567"
              className="w-full h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("phone")}
            />
            {errors.phone && <p className="text-red-500 text-[12px] mt-[4px]">{errors.phone.message}</p>}
          </div>

          {/* Role */}
          <div>
            <label className="block font-[500] text-[14px] text-black mb-[5px]">Role</label>
            <div className="h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-gray-400 bg-gray-50 flex items-center">
              {initialInfo.role?.name || "Superadmin"}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block font-[500] text-[14px] text-black mb-[5px]">Status</label>
            <div className="h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] bg-gray-50 flex items-center">
              <span className={`px-[8px] py-[2px] rounded-full text-[12px] font-[500] ${
                initialInfo.status === "active" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {initialInfo.status || "—"}
              </span>
            </div>
          </div>

          {/* Submit */}
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] h-[48px] px-[20px] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50"
            >
              {isSubmitting ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      )}
    </>
  );
};
