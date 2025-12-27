/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useAuth } from "@/hooks/useAuth"
import { useEffect, useState } from "react";
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

export const ProfileForm = () => {
  const { infoCandidate } = useAuth();
  const [avatars, setAvatars] = useState<any[]>([]);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  
  useEffect(() => {
    if(infoCandidate) {
      if(infoCandidate.avatar) {
        setAvatars([
          {
            source: infoCandidate.avatar
          }
        ]);
      }

      const validator = new JustValidate('#profileForm');

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
            rule: 'customRegexp',
            value: /^(0?)(3[2-9]|5[6|8|9]|7[0|6-9]|8[0-6|8|9]|9[0-4|6-9])[0-9]{7}$/,
            errorMessage: "Invalid phone number format!"
          },
        ])
        .addField('#studentId', [
          {
            rule: 'customRegexp',
            value: /^$|^[0-9]{8}$/,
            errorMessage: "Student ID must be exactly 8 digits!"
          },
        ])
        .onFail(() => {
          setIsValid(false);
        })
        .onSuccess(() => {
          setIsValid(true);
        })
    }
  }, [infoCandidate]);

  const handleSubmit = (event: any) => {
    if(isValid) {
      const fullName = event.target.fullName.value;
      const email = event.target.email.value;
      const phone = event.target.phone.value;
      const studentId = event.target.studentId?.value || "";
      let avatar = null;
      if(avatars.length > 0) {
        avatar = avatars[0].file;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("studentId", studentId);
      formData.append("avatar", avatar);

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/profile`, {
        method: "PATCH",
        body: formData,
        credentials: "include", // Send with cookie
      })
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
                  Verified UIT Student
                </div>
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
                className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                defaultValue={infoCandidate.fullName}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="studentId"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Student ID {!infoCandidate.isVerified && <span className="text-[#999] text-[12px]">- Required to apply for jobs</span>}
              </label>
              <input
                type="text"
                name="studentId"
                id="studentId"
                placeholder="e.g., 25560053"
                maxLength={8}
                className={`w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] ${infoCandidate.isVerified ? 'text-gray-400 bg-gray-50' : 'text-black'}`}
                defaultValue={infoCandidate.studentId || ""}
                disabled={infoCandidate.isVerified}
              />
              {!infoCandidate.isVerified && infoCandidate.studentId && (
                <p className="text-[#FFB200] text-[12px] mt-[5px]">Pending verification by admin</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="avatar"
                className="block font-[500] text-[14px] text-black mb-[5px]"
              >
                Avatar
              </label>
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
                  className="flex-1 h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-gray-400 bg-gray-50"
                  defaultValue={infoCandidate.email}
                  disabled
                />
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  className="px-[16px] h-[46px] bg-[#FFB200] rounded-[4px] font-[600] text-[14px] text-black hover:bg-[#E6A000] whitespace-nowrap"
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
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
                defaultValue={infoCandidate.phone}
              />
            </div>
            <div className="sm:col-span-2">
              <button className="bg-[#0088FF] rounded-[4px] h-[48px] px-[20px] font-[700] text-[16px] text-white">
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