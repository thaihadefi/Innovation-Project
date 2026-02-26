"use client"
import { normalizeSkillDisplay, normalizeSkillKey } from "@/utils/skill";
import { useState } from "react";
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

interface ProfileFormProps {
  initialCandidateInfo: any;
}

export const ProfileForm = ({ initialCandidateInfo }: ProfileFormProps) => {
  const [infoCandidate] = useState(initialCandidateInfo);
  const [avatars, setAvatars] = useState<any[]>(initialCandidateInfo?.avatar ? [{ source: initialCandidateInfo.avatar }] : []);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [skills, setSkills] = useState<string[]>(initialCandidateInfo?.skills || []);
  const [skillInput, setSkillInput] = useState<string>("");
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

  const addSkill = (rawValue: string) => {
    const cleanInput = rawValue.replace(/,/g, "").trim();
    const displaySkill = normalizeSkillDisplay(cleanInput);
    const skillKey = normalizeSkillKey(displaySkill);
    if (!displaySkill || !skillKey) return;
    const exists = skills.some((skill) => normalizeSkillKey(skill) === skillKey);
    if (!exists) { setSkills([...skills, displaySkill]); setSkillsError(""); }
  };

  const disabledInputClass = "text-gray-400 bg-gray-50 cursor-not-allowed";
  const enabledInputClass = "text-black";

  const onSubmit = async (data: CandidateProfileFormData) => {
    if (skills.length === 0) {
      setSkillsError("Please enter at least one skill.");
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
    const hasNewFile = !!avatarFile && avatars[0]?.source !== infoCandidate?.avatar;
    let fetchOptions: RequestInit;
    if (hasNewFile) {
      const formData = new FormData();
      formData.append("fullName", data.fullName);
      formData.append("email", infoCandidate.email);
      formData.append("phone", data.phone);
      formData.append("studentId", data.studentId);
      formData.append("cohort", data.cohort);
      formData.append("major", data.major);
      formData.append("avatar", avatarFile);
      formData.append("skills", JSON.stringify(skills));
      fetchOptions = { method: "PATCH", body: formData, credentials: "include" };
    } else {
      fetchOptions = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: data.fullName, email: infoCandidate.email, phone: data.phone,
          studentId: data.studentId, cohort: data.cohort, major: data.major,
          skills: JSON.stringify(skills),
          ...(avatars.length === 0 && { avatar: null }),
        }),
        credentials: "include",
      };
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/profile`, fetchOptions);
      const result = await res.json();
      if (result.code == "error") toast.error(result.message);
      if (result.code == "success") toast.success(result.message);
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
            onSubmit={handleSubmit(onSubmit)}
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
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                disabled={infoCandidate.isVerified}
                {...register("fullName")}
              />
              {errors.fullName && <p className="text-red-500 text-[12px] mt-[4px]">{errors.fullName.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="studentId" className="block font-[500] text-[14px] text-black mb-[5px]">Student ID *</label>
              <input type="text" id="studentId" placeholder="e.g., 25560053" maxLength={8} autoComplete="off"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                disabled={infoCandidate.isVerified}
                {...register("studentId")}
              />
              {errors.studentId && <p className="text-red-500 text-[12px] mt-[4px]">{errors.studentId.message}</p>}
            </div>
            <div>
              <label htmlFor="cohort" className="block font-[500] text-[14px] text-black mb-[5px]">Cohort *</label>
              <input type="text" id="cohort" placeholder="e.g., 2025" maxLength={4} autoComplete="off"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                disabled={infoCandidate.isVerified}
                {...register("cohort")}
              />
              {errors.cohort && <p className="text-red-500 text-[12px] mt-[4px]">{errors.cohort.message}</p>}
            </div>
            <div>
              <label htmlFor="major" className="block font-[500] text-[14px] text-black mb-[5px]">Major *</label>
              <input type="text" id="major" placeholder="e.g., Computer Science (BCU)" maxLength={100} autoComplete="organization-title"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                disabled={infoCandidate.isVerified}
                {...register("major")}
              />
              {errors.major && <p className="text-red-500 text-[12px] mt-[4px]">{errors.major.message}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="skills" className="block font-[500] text-[14px] text-black mb-[5px]">
                Skills * <span className="text-[#999] text-[12px]">- For job recommendations</span>
              </label>
              <div className="flex flex-wrap gap-[8px] mb-[8px]">
                {skills.map((skill, index) => (
                  <span key={index} className="inline-flex items-center gap-[4px] bg-[#0088FF] text-white px-[12px] py-[6px] rounded-full text-[13px]">
                    {skill}
                    <button type="button" onClick={() => setSkills(skills.filter((_, i) => i !== index))} className="hover:text-red-200">×</button>
                  </span>
                ))}
              </div>
              <div className="flex gap-[8px]">
                <input id="skills" type="text" placeholder="e.g., reactjs, nodejs, python..."
                  value={skillInput} onChange={(e) => setSkillInput(e.target.value)} autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      addSkill(skillInput);
                      setSkillInput('');
                    }
                  }}
                  className="flex-1 h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                />
                <button type="button" onClick={() => { addSkill(skillInput); setSkillInput(''); }}
                  className="px-[16px] h-[46px] bg-[#E0E0E0] rounded-[8px] font-[600] text-[14px] hover:bg-[#D0D0D0] cursor-pointer transition-colors duration-200">
                  Add
                </button>
              </div>
              <p className="text-[#999] text-[12px] mt-[5px]">Press Enter or comma to add skills</p>
              {skillsError && <p className="text-red-500 text-[12px] mt-[4px]">{skillsError}</p>}
            </div>
            <div className="sm:col-span-2">
              <p className="block font-[500] text-[14px] text-black mb-[5px]">Avatar</p>
              <FilePond
                name="avatar"
                labelIdle='<span class="filepond--label-action">+ Upload avatar</span>'
                acceptedFileTypes={['image/*']}
                files={avatars}
                onupdatefiles={setAvatars}
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
          currentEmail={infoCandidate.email}
          accountType="candidate"
        />
      )}
    </>
  );
};
