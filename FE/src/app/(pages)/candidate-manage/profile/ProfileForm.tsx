"use client"
import { useState } from "react";
import { SkillInputAutocomplete } from "@/app/components/skill-input-autocomplete";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { Toaster, toast } from 'sonner';
import { EmailChangeModal } from "@/app/components/modal/EmailChangeModal";
import { candidateProfileSchema, type CandidateProfileFormData } from "@/schemas/profile.schema";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview
);

import { useAuthContext } from "@/contexts/AuthContext";
import { revalidateCompanyProfile } from "@/actions/revalidate";
import type { CandidateInfo } from "@/types/auth";
import type { UploadFile } from "@/types/common";
import { toFilePondFiles, fromFilePondFiles } from "@/utils/filepond";

interface ProfileFormProps {
  initialCandidateInfo: CandidateInfo | null;
}

export const ProfileForm = ({ initialCandidateInfo }: ProfileFormProps) => {
  const { refreshAuth } = useAuthContext();
  const [infoCandidate] = useState(initialCandidateInfo);
  const isGoogleAvatar = Boolean(initialCandidateInfo?.avatar?.includes("googleusercontent.com"));
  const [avatars, setAvatars] = useState<UploadFile[]>(
    initialCandidateInfo?.avatar && !isGoogleAvatar ? [{ source: initialCandidateInfo.avatar }] : []
  );
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [skills, setSkills] = useState<string[]>(initialCandidateInfo?.skills || []);
  const [skillsError, setSkillsError] = useState<string>("");

  const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<CandidateProfileFormData>({
    resolver: zodResolver(candidateProfileSchema),
    defaultValues: {
      fullName: initialCandidateInfo?.fullName || "",
      phone: initialCandidateInfo?.phone || "",
      studentId: initialCandidateInfo?.studentId || "",
      cohort: initialCandidateInfo?.cohort != null ? String(initialCandidateInfo.cohort) : "",
      major: initialCandidateInfo?.major || "",
    },
  });

  const disabledInputClass = "text-gray-400 bg-gray-50 cursor-not-allowed";
  const enabledInputClass = "text-black";

  const onSubmit = async (data: CandidateProfileFormData) => {
    if (skills.length === 0) {
      setSkillsError("Please enter at least one skill.");
      toast.error("Please enter at least one skill.");
      return;
    }
    setSkillsError("");
    const currentYear = new Date().getFullYear();
    if (data.cohort) {
      const cohortNum = parseInt(data.cohort, 10);
      if (Number.isNaN(cohortNum) || cohortNum < 2006 || cohortNum > currentYear) {
        setError("cohort", { message: `Cohort must be between 2006 and ${currentYear}` });
        return;
      }
    }
    const avatarFile = avatars[0]?.file;
    const hasNewFile = !!avatarFile && (isGoogleAvatar || avatars[0]?.source !== infoCandidate?.avatar);
    let fetchOptions: RequestInit;
    if (hasNewFile) {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("email", infoCandidate?.email ?? "");
      formData.append("phone", data.phone);
      formData.append("studentId", data.studentId);
      formData.append("cohort", data.cohort);
      formData.append("major", data.major);
      if (avatarFile) formData.append("avatar", avatarFile);
      formData.append("skills", JSON.stringify(skills));
      fetchOptions = { method: "PATCH", body: formData, credentials: "include" };
    } else {
      fetchOptions = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName, email: infoCandidate?.email ?? "", phone: data.phone,
          studentId: data.studentId, cohort: data.cohort, major: data.major,
          skills: JSON.stringify(skills),
          ...(avatars.length === 0 && !isGoogleAvatar && { avatar: null }),
        }),
        credentials: "include",
      };
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/profile`, fetchOptions);
      const result = await res.json();
      if (result.code == "error") toast.error(result.message);
      if (result.code == "success") {
        toast.success(result.message);
        refreshAuth();
        await revalidateCompanyProfile();
      }
    } catch {
      toast.error("Network error. Please try again.");
    }
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      {infoCandidate && (
        <>
          <form
            className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]"
            onSubmit={handleSubmit(onSubmit, (errors) => {
              const firstError = Object.values(errors)[0];
              if (firstError?.message) toast.error(firstError.message as string);
            })}
          >
            {infoCandidate.isVerified && (
              <div className="sm:col-span-2">
                <div className="inline-flex items-center gap-[8px] bg-green-100 text-green-700 px-[12px] py-[6px] rounded-full font-[600] text-[14px]">
                  <svg className="w-[16px] h-[16px]" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Verified UIT Student/Alumni
                </div>
              </div>
            )}
            {infoCandidate.isVerified && !infoCandidate.major && (
              <div className="sm:col-span-2">
                <div className="flex items-start sm:items-center gap-[10px] text-[#0088FF] text-[13px] bg-blue-50 border border-blue-200 rounded-[8px] px-[14px] py-[10px] font-[500]">
                  <svg className="w-[16px] h-[16px] shrink-0 mt-[2px] sm:mt-0 text-[#0088FF]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 1118 0z" />
                  </svg>
                  <span>
                    Welcome! Please complete your profile with your <strong>Phone Number</strong>, <strong>Skills</strong>, and <strong>Major</strong>. Note that while phone and skills can be updated at any time, your <strong>Major</strong> will be locked once saved to ensure credential authenticity.
                  </span>
                </div>
              </div>
            )}
            {!infoCandidate.isVerified && infoCandidate.fullName && infoCandidate.studentId && infoCandidate.cohort && infoCandidate.major && (
              <div className="sm:col-span-2">
                <p className="text-[#FFB200] text-[12px]">Pending verification by admin</p>
              </div>
            )}
            {!infoCandidate.isVerified && (
              <div className="sm:col-span-2">
                <p className="text-[#999] text-[12px]">These fields are required for verification.</p>
              </div>
            )}
            <div className="sm:col-span-2">
              <label htmlFor="fullName" className="block font-[500] text-[14px] text-black mb-[5px]">Full Name *</label>
              <input type="text" id="fullName" autoComplete="name"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified && Boolean(infoCandidate.fullName) ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                disabled={Boolean(infoCandidate.isVerified && infoCandidate.fullName)}
                {...register("fullName")}
              />
              {errors.fullName && <p className="text-red-500 text-[12px] mt-[4px]">{errors.fullName.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="studentId" className="block font-[500] text-[14px] text-black mb-[5px]">Student ID *</label>
              <input type="text" id="studentId" placeholder="e.g., 25560053" maxLength={8} autoComplete="off"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified && Boolean(infoCandidate.studentId) ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                disabled={Boolean(infoCandidate.isVerified && infoCandidate.studentId)}
                {...register("studentId")}
              />
              {errors.studentId && <p className="text-red-500 text-[12px] mt-[4px]">{errors.studentId.message}</p>}
            </div>
            <div>
              <label htmlFor="cohort" className="block font-[500] text-[14px] text-black mb-[5px]">Cohort *</label>
              <input type="text" id="cohort" placeholder="e.g., 2025" maxLength={4} autoComplete="off"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified && Boolean(infoCandidate.cohort) ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                disabled={Boolean(infoCandidate.isVerified && infoCandidate.cohort)}
                {...register("cohort")}
              />
              {errors.cohort && <p className="text-red-500 text-[12px] mt-[4px]">{errors.cohort.message}</p>}
            </div>
            <div>
              <label htmlFor="major" className="block font-[500] text-[14px] text-black mb-[5px]">Major *</label>
              <input type="text" id="major" placeholder="e.g., Computer Science (BCU)" maxLength={100} autoComplete="organization-title"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified && Boolean(infoCandidate.major) ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                disabled={Boolean(infoCandidate.isVerified && infoCandidate.major)}
                {...register("major")}
              />
              {errors.major && <p className="text-red-500 text-[12px] mt-[4px]">{errors.major.message}</p>}
            </div>
            <SkillInputAutocomplete
              skills={skills}
              setSkills={setSkills}
              skillsError={skillsError}
              hint="- For job recommendations"
              onSkillAdded={() => setSkillsError("")}
            />
            <div className="sm:col-span-2">
              <p className="block font-[500] text-[14px] text-black mb-[5px]">Avatar</p>
              {infoCandidate?.avatar && (
                <div className="flex items-center gap-[12px] mb-[10px] p-[10px] bg-gray-50 border border-[#E5E7EB] rounded-[8px]">
                  <img
                    src={infoCandidate.avatar}
                    alt={infoCandidate.fullName || "Avatar"}
                    referrerPolicy="no-referrer"
                    className="w-[44px] h-[44px] rounded-full object-cover border border-[#DEDEDE]"
                  />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-[500] text-[#374151]">Current Avatar</span>
                    <span className="text-[11px] text-[#6B7280]">Upload below if you wish to change it</span>
                  </div>
                </div>
              )}
              <FilePond
                name="avatar"
                labelIdle='<span class="filepond--label-action">+ Upload avatar</span>'
                acceptedFileTypes={['image/*']}
                files={toFilePondFiles(avatars)}
                onupdatefiles={(items) => setAvatars(fromFilePondFiles(items))}
                credits={false}
              />
            </div>
            <div className="">
              <label htmlFor="email" className="block font-[500] text-[14px] text-black mb-[5px]">Email *</label>
              <div className="flex gap-[10px]">
                <input type="email" id="email" autoComplete="email"
                  className="flex-1 h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-gray-400 bg-gray-50"
                  defaultValue={infoCandidate.email} disabled
                />
                <button type="button" onClick={() => setShowEmailModal(true)}
                  className="px-[16px] h-[46px] bg-[#FFB200] rounded-[8px] font-[600] text-[14px] text-black hover:bg-[#E6A000] whitespace-nowrap cursor-pointer transition-colors duration-200">
                  Change
                </button>
              </div>
            </div>
            <div className="">
              <label htmlFor="phone" className="block font-[500] text-[14px] text-black mb-[5px]">Phone Number *</label>
              <input type="text" id="phone" autoComplete="tel"
                className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                {...register("phone")}
              />
              {errors.phone && <p className="text-red-500 text-[12px] mt-[4px]">{errors.phone.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] h-[48px] px-[20px] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
                Update
              </button>
            </div>
          </form>
        </>
      )}
      {infoCandidate && (
        <EmailChangeModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          currentEmail={infoCandidate.email ?? ""}
          accountType="candidate"
        />
      )}
    </>
  );
};
