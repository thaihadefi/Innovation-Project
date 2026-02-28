"use client"
import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { Toaster, toast } from 'sonner';
import dynamic from 'next/dynamic';
import { EmailChangeModal } from "@/app/components/modal/EmailChangeModal";
import { companyProfileSchema, type CompanyProfileFormData } from "@/schemas/profile.schema";
import { useAuthContext } from "@/contexts/AuthContext";
import { revalidateCompanyProfile } from "@/actions/revalidate";

// Lazy load TinyMCE to reduce bundle size
const EditorMCE = dynamic(
  () => import("@/app/components/editor/EditorMCE").then(mod => mod.EditorMCE),
  { ssr: false, loading: () => <div className="h-[200px] bg-[#F9F9F9] rounded-[8px] animate-pulse" /> }
);

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview
);

interface ProfileFormProps {
  initialCompanyInfo: any;
  initialCityList: any[];
  initialFollowerCount: number;
}

export const ProfileForm = ({ initialCompanyInfo, initialCityList, initialFollowerCount }: ProfileFormProps) => {
  const { refreshAuth } = useAuthContext();
  const [companyInfo] = useState<any>(initialCompanyInfo);
  const [logos, setLogos] = useState<any[]>(initialCompanyInfo?.logo ? [{ source: initialCompanyInfo.logo }] : []);
  const [locationList] = useState<any[]>(initialCityList);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [followerCount] = useState<number>(initialFollowerCount);
  const editorRef = useRef(null);
  const disabledInputClass = "text-gray-400 bg-gray-50 cursor-not-allowed";

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CompanyProfileFormData>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      phone: initialCompanyInfo?.phone || "",
      location: initialCompanyInfo?.location || "",
      address: initialCompanyInfo?.address || "",
      companyModel: initialCompanyInfo?.companyModel || "",
      companyEmployees: initialCompanyInfo?.companyEmployees || "",
      workingTime: initialCompanyInfo?.workingTime || "",
      workOverTime: initialCompanyInfo?.workOverTime || "",
    },
  });

  const onSubmit = async (data: CompanyProfileFormData) => {
    // Guard: TinyMCE may not be mounted yet on slow connections
    if (!editorRef.current) {
      toast.error("Editor is still loading. Please wait a moment and try again.");
      return;
    }

    const companyName = companyInfo?.companyName || "";
    const logoFile = logos[0]?.file;
    const location = data.location || "";
    const address = data.address || "";
    const companyModel = data.companyModel || "";
    const companyEmployees = data.companyEmployees || "";
    const workingTime = data.workingTime || "";
    const workOverTime = data.workOverTime || "";
    const description = (editorRef.current as any).getContent();

    const hasNewFile = !!logoFile && logos[0]?.source !== companyInfo?.logo;
    let fetchOptions: RequestInit;

    if (hasNewFile) {
      const formData = new FormData();
      formData.append("companyName", companyName);
      formData.append("logo", logoFile);
      formData.append("location", location);
      formData.append("address", address);
      formData.append("companyModel", companyModel);
      formData.append("companyEmployees", companyEmployees);
      formData.append("workingTime", workingTime);
      formData.append("workOverTime", workOverTime);
      formData.append("email", companyInfo.email);
      formData.append("phone", data.phone || "");
      formData.append("description", description);
      fetchOptions = { method: "PATCH", body: formData, credentials: "include" };
    } else {
      fetchOptions = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName, location, address, companyModel,
          companyEmployees, workingTime, workOverTime,
          email: companyInfo.email, phone: data.phone || "", description,
          ...(logos.length === 0 && { logo: null }),
        }),
        credentials: "include",
      };
    }

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/profile`, fetchOptions);
      const result = await res.json();
      if (result.code == "error") toast.error(result.message);
      if (result.code == "success") {
        toast.success(result.message);
        refreshAuth(); // Update header logo/name immediately (clears 5-min sessionStorage cache)
        await revalidateCompanyProfile(); // Bust Router Cache for home, company/list, etc.
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      {companyInfo && (
        <>
          <div className="mb-[20px] inline-flex items-center gap-[8px] bg-blue-50 text-blue-700 px-[16px] py-[10px] rounded-[8px]">
            <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <span className="font-[600] text-[14px]">
              {followerCount} {followerCount === 1 ? "Follower" : "Followers"}
            </span>
          </div>

          <form
            className="grid sm:grid-cols-2 grid-cols-1 gap-y-[15px] gap-x-[20px]"
            onSubmit={handleSubmit(onSubmit, (errors) => {
              const firstError = Object.values(errors)[0];
              if (firstError?.message) toast.error(firstError.message as string);
            })}
          >
            <div className="sm:col-span-2">
              <label htmlFor="companyName" className="font-[500] text-[14px] text-black mb-[5px]">Company Name *</label>
              <input type="text" name="companyName" id="companyName" autoComplete="organization"
                className={`w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] ${disabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                defaultValue={companyInfo.companyName} disabled
              />
            </div>
            <div className="sm:col-span-2">
              <p className="font-[500] text-[14px] text-black mb-[5px]">Logo</p>
              <FilePond name="logo"
                labelIdle='<span class="filepond--label-action">+ Upload logo</span>'
                acceptedFileTypes={['image/*']}
                files={logos} onupdatefiles={setLogos} credits={false}
              />
            </div>
            <div className="">
              <label htmlFor="location" className="font-[500] text-[14px] text-black mb-[5px]">Location</label>
              <select id="location"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                {...register("location")}>
                <option value="">Select Province/Location</option>
                {locationList.map(item => (
                  <option key={item._id} value={item._id}>{item.name}</option>
                ))}
              </select>
            </div>
            <div className="">
              <label htmlFor="address" className="font-[500] text-[14px] text-black mb-[5px]">Address</label>
              <input type="text" id="address" autoComplete="street-address" maxLength={200}
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                {...register("address")}
              />
              {errors.address && <p className="text-red-500 text-[12px] mt-[4px]">{errors.address.message}</p>}
            </div>
            <div className="">
              <label htmlFor="companyModel" className="font-[500] text-[14px] text-black mb-[5px]">Company Model</label>
              <input type="text" id="companyModel" autoComplete="off" maxLength={100}
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                {...register("companyModel")}
              />
              {errors.companyModel && <p className="text-red-500 text-[12px] mt-[4px]">{errors.companyModel.message}</p>}
            </div>
            <div className="">
              <label htmlFor="companyEmployees" className="font-[500] text-[14px] text-black mb-[5px]">Company Size</label>
              <input type="text" id="companyEmployees" autoComplete="off" maxLength={50}
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                {...register("companyEmployees")}
              />
              {errors.companyEmployees && <p className="text-red-500 text-[12px] mt-[4px]">{errors.companyEmployees.message}</p>}
            </div>
            <div className="">
              <label htmlFor="workingTime" className="font-[500] text-[14px] text-black mb-[5px]">Working Hours</label>
              <input type="text" id="workingTime" autoComplete="off" maxLength={100}
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                {...register("workingTime")}
              />
              {errors.workingTime && <p className="text-red-500 text-[12px] mt-[4px]">{errors.workingTime.message}</p>}
            </div>
            <div className="">
              <label htmlFor="workOverTime" className="font-[500] text-[14px] text-black mb-[5px]">Overtime Work</label>
              <input type="text" id="workOverTime" autoComplete="off" maxLength={100}
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                {...register("workOverTime")}
              />
              {errors.workOverTime && <p className="text-red-500 text-[12px] mt-[4px]">{errors.workOverTime.message}</p>}
            </div>
            <div className="">
              <label htmlFor="email" className="font-[500] text-[14px] text-black mb-[5px]">Email *</label>
              <div className="flex gap-[10px]">
                <input type="email" id="email" autoComplete="email"
                  className="flex-1 h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-gray-400 bg-gray-50"
                  defaultValue={companyInfo.email} disabled
                />
                <button type="button" onClick={() => setShowEmailModal(true)}
                  className="px-[16px] h-[46px] bg-[#FFB200] rounded-[8px] font-[600] text-[14px] text-black hover:bg-[#E6A000] whitespace-nowrap cursor-pointer transition-colors duration-200">
                  Change
                </button>
              </div>
            </div>
            <div className="">
              <label htmlFor="phone" className="font-[500] text-[14px] text-black mb-[5px]">Phone Number</label>
              <input type="text" id="phone" autoComplete="tel"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                {...register("phone")}
              />
              {errors.phone && <p className="text-red-500 text-[12px] mt-[4px]">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="description" className="font-[500] text-[14px] text-black mb-[5px]">Detailed Description</label>
              <EditorMCE editorRef={editorRef} value={companyInfo.description} id="description" />
            </div>
            <div className="">
              <button type="submit" disabled={isSubmitting} className="px-[20px] h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
                Update
              </button>
            </div>
          </form>
        </>
      )}

      {companyInfo && (
        <EmailChangeModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          currentEmail={companyInfo.email}
          accountType="company"
        />
      )}
    </>
  );
};
