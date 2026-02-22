"use client"
import { normalizeSkillDisplay, normalizeSkillKey } from "@/utils/skill";
import { useEffect, useRef, useState } from "react";
import JustValidate from 'just-validate';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { Toaster, toast } from 'sonner';
import { EmailChangeModal } from "@/app/components/modal/EmailChangeModal";

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
  const validatorRef = useRef<InstanceType<typeof JustValidate> | null>(null);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [skills, setSkills] = useState<string[]>(initialCandidateInfo?.skills || []);
  const [skillInput, setSkillInput] = useState<string>("");

  const addSkill = (rawValue: string) => {
    const cleanInput = rawValue.replace(/,/g, "").trim();
    const displaySkill = normalizeSkillDisplay(cleanInput);
    const skillKey = normalizeSkillKey(displaySkill);
    if (!displaySkill || !skillKey) return;

    const exists = skills.some((skill) => normalizeSkillKey(skill) === skillKey);
    if (!exists) {
      setSkills([...skills, displaySkill]);
    }
  };

  useEffect(() => {
    if(infoCandidate) {
      const validator = new JustValidate('#profileForm');
      validatorRef.current = validator;

      validator
        .addField('#fullName', [
          {
            rule: 'required',
            errorMessage: "Please enter full name!"
          },
          {
            rule: 'minLength',
            value: 5,
            errorMessage: "Full name must be at least 5 characters!"
          },
          {
            rule: 'maxLength',
            value: 50,
            errorMessage: "Full name must not exceed 50 characters!"
          },
        ])
        .addField('#email', [
          {
            rule: 'required',
            errorMessage: "Please enter email!"
          },
          {
            rule: 'email',
            errorMessage: "Invalid email format!"
          },
        ])
        .addField('#phone', [
          {
            rule: 'required',
            errorMessage: "Please enter phone number!"
          },
          {
            rule: 'customRegexp',
            value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
            errorMessage: "Invalid phone number format!"
          },
        ])
        .addField('#studentId', [
          {
            rule: 'required',
            errorMessage: "Please enter student ID!"
          },
          {
            rule: 'customRegexp',
            value: /^[0-9]{8}$/,
            errorMessage: "Student ID must be exactly 8 digits!"
          },
        ])
        .addField('#cohort', [
          {
            rule: 'required',
            errorMessage: "Please enter cohort!"
          },
          {
            rule: 'customRegexp',
            value: /^[0-9]{4}$/,
            errorMessage: "Cohort must be a 4-digit year!"
          },
        ])
        .addField('#major', [
          {
            rule: 'required',
            errorMessage: "Please enter major!"
          },
          {
            rule: 'minLength',
            value: 2,
            errorMessage: "Major must be at least 2 characters!"
          },
          {
            rule: 'maxLength',
            value: 100,
            errorMessage: "Major must not exceed 100 characters!"
          },
          {
            rule: 'customRegexp',
            value: /^[\p{L}0-9 .,&()\-]+$/u,
            errorMessage: "Major contains invalid characters!"
          },
        ])
        .onFail(() => {})
        .onSuccess(() => {})

      return () => {
        validator.destroy();
      };
    }
  }, [infoCandidate]);

  const disabledInputClass = "text-gray-400 bg-gray-50 cursor-not-allowed";
  const enabledInputClass = "text-black";

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    const validator = validatorRef.current;
    if (!validator) {
      toast.error("Validator not initialized.");
      return;
    }
    const isFormValid = await validator.revalidate();
    if (!isFormValid) return;

    if (skills.length === 0) {
      toast.error("Please enter at least one skill.");
      return;
    }
    const fullName = event.target.fullName.value;
    const email = event.target.email.value;
    const phone = event.target.phone.value;
    const studentId = event.target.studentId?.value || "";
    const cohort = event.target.cohort?.value || "";
    const major = event.target.major?.value || "";
    const currentYear = new Date().getFullYear();
    if (cohort) {
      const cohortNum = parseInt(cohort, 10);
      if (Number.isNaN(cohortNum) || cohortNum < 2006 || cohortNum > currentYear) {
        toast.error(`Cohort must be between 2006 and ${currentYear}`);
        return;
      }
    }
    const avatarFile = avatars[0]?.file;

    // Compare current source with initial URL — if same, no new file was picked
    const hasNewFile = !!avatarFile && avatars[0]?.source !== infoCandidate?.avatar;
    let fetchOptions: RequestInit;

    if (hasNewFile) {
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("studentId", studentId);
      formData.append("cohort", cohort);
      formData.append("major", major);
      formData.append("avatar", avatarFile);
      formData.append("skills", JSON.stringify(skills));
      fetchOptions = {
        method: "PATCH",
        body: formData,
        credentials: "include",
      };
    } else {
      fetchOptions = {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName, email, phone, studentId,
          cohort, major, skills: JSON.stringify(skills),
        }),
        credentials: "include",
      };
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/profile`, fetchOptions)
      .then(res => res.json())
      .then(data => {
        if(data.code == "error") {
          toast.error(data.message);
        }

        if(data.code == "success") {
          toast.success(data.message);
        }
      })
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      {infoCandidate && (
        <>
          <form
            action=""
            className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]"
            id="profileForm"
            onSubmit={handleSubmit}
          >
            {/* Verified Badge */}
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
            {!infoCandidate.isVerified &&
              infoCandidate.fullName &&
              infoCandidate.studentId &&
              infoCandidate.cohort &&
              infoCandidate.major && (
                <div className="sm:col-span-2">
                  <p className="text-[#FFB200] text-[12px]">
                    Pending verification by admin
                  </p>
                </div>
              )}
            {!infoCandidate.isVerified && (
              <div className="sm:col-span-2">
                <p className="text-[#999] text-[12px]">
                  These fields are required for verification.
                </p>
              </div>
            )}
            <div className="sm:col-span-2">
              <label
                htmlFor="fullName"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                id="fullName"
                autoComplete="name"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                defaultValue={infoCandidate.fullName}
                disabled={infoCandidate.isVerified}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="studentId"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Student ID *
              </label>
              <input
                type="text"
                name="studentId"
                id="studentId"
                placeholder="e.g., 25560053"
                maxLength={8}
                autoComplete="off"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                defaultValue={infoCandidate.studentId || ""}
                disabled={infoCandidate.isVerified}
              />
            </div>
            <div>
              <label
                htmlFor="cohort"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Cohort *
              </label>
              <input
                type="text"
                name="cohort"
                id="cohort"
                placeholder="e.g., 2025"
                maxLength={4}
                autoComplete="off"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                defaultValue={infoCandidate.cohort || ""}
                disabled={infoCandidate.isVerified}
              />
            </div>
            <div>
              <label
                htmlFor="major"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Major *
              </label>
              <input
                type="text"
                name="major"
                id="major"
                placeholder="e.g., Computer Science (BCU)"
                maxLength={100}
                autoComplete="organization-title"
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? disabledInputClass : enabledInputClass} focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200`}
                defaultValue={infoCandidate.major || ""}
                disabled={infoCandidate.isVerified}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="skills"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Skills * <span className="text-[#999] text-[12px]">- For job recommendations</span>
              </label>
              <div className="flex flex-wrap gap-[8px] mb-[8px]">
                {skills.map((skill, index) => (
                  <span 
                    key={index}
                    className="inline-flex items-center gap-[4px] bg-[#0088FF] text-white px-[12px] py-[6px] rounded-full text-[13px]"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => setSkills(skills.filter((_, i) => i !== index))}
                      className="hover:text-red-200"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-[8px]">
                <input
                  id="skills"
                  name="skillsInput"
                  type="text"
                  placeholder="e.g., reactjs, nodejs, python..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ',') {
                      e.preventDefault();
                      // Get value without comma, clean it
                      const rawValue = e.key === ',' ? skillInput : skillInput;
                      addSkill(rawValue);
                      setSkillInput('');
                    }
                  }}
                  className="flex-1 h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={() => {
                    addSkill(skillInput);
                    setSkillInput(''); // Clear input first
                  }}
                  className="px-[16px] h-[46px] bg-[#E0E0E0] rounded-[8px] font-[600] text-[14px] hover:bg-[#D0D0D0] cursor-pointer transition-colors duration-200"
                >
                  Add
                </button>
              </div>
              <p className="text-[#999] text-[12px] mt-[5px]">Press Enter or comma to add skills</p>
            </div>
            <div className="sm:col-span-2">
              <p className="block font-[500] text-[14px] text-black mb-[5px]">
                Avatar
              </p>
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
              <label
                htmlFor="email"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Email *
              </label>
              <div className="flex gap-[10px]">
                <input
                  type="email"
                  name="email"
                  id="email"
                  autoComplete="email"
                  className="flex-1 h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-gray-400 bg-gray-50"
                  defaultValue={infoCandidate.email}
                  disabled
                />
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="px-[16px] h-[46px] bg-[#FFB200] rounded-[8px] font-[600] text-[14px] text-black hover:bg-[#E6A000] whitespace-nowrap cursor-pointer transition-colors duration-200"
                >
                  Change
                </button>
              </div>
            </div>
            <div className="">
              <label
                htmlFor="phone"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Phone Number *
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                autoComplete="tel"
                className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCandidate.phone}
              />
            </div>
            <div className="sm:col-span-2">
              <button className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] h-[48px] px-[20px] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
                Update
              </button>
            </div>
          </form>
        </>
      )}

      {/* Email Change Modal */}
      {infoCandidate && (
        <EmailChangeModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          currentEmail={infoCandidate.email}
          accountType="candidate"
        />
      )}
    </>
  )
}
