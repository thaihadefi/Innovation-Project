/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { useAuth } from "@/hooks/useAuth"
import { useEffect, useRef, useState } from "react";
import JustValidate from 'just-validate';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { Toaster, toast } from 'sonner';
import dynamic from 'next/dynamic';
import { EmailChangeModal } from "@/app/components/modal/EmailChangeModal";

// Lazy load TinyMCE to reduce bundle size
const EditorMCE = dynamic(
  () => import("@/app/components/editor/EditorMCE").then(mod => mod.EditorMCE),
  { ssr: false, loading: () => <div className="h-[200px] bg-[#F9F9F9] rounded-[8px] animate-pulse" /> }
);

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview
);

export const ProfileForm = () => {
  const { infoCompany } = useAuth();
  const [logos, setLogos] = useState<any[]>([]);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [cityList, setCityList] = useState<any[]>([]);
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [followerCount, setFollowerCount] = useState<number>(0);
  const editorRef = useRef(null);

  // Fetch cities
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/list`)
      .then(res => res.json())
      .then(data => {
        if(data.code == "success") {
          // Sort cities alphabetically by name
          const sortedCities = data.cityList.sort((a: any, b: any) => 
            a.name.localeCompare(b.name, 'vi')
          );
          setCityList(sortedCities);
        }
      })
  }, []);

  // Fetch follower count
  useEffect(() => {
    if (infoCompany) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/follower-count`, {
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => {
          if (data.code === "success") {
            setFollowerCount(data.followerCount);
          }
        });
    }
  }, [infoCompany]);

  useEffect(() => {
    if(infoCompany) {
      if(infoCompany.logo) {
        setLogos([
          {
            source: infoCompany.logo
          }
        ]);
      }

      const validator = new JustValidate('#profileForm');

      validator
        .addField('#companyName', [
          {
            rule: 'required',
            errorMessage: "Please enter company name!"
          },
          {
            rule: 'minLength',
            value: 3,
            errorMessage: "Company name must be at least 3 characters!"
          },
          {
            rule: 'maxLength',
            value: 200,
            errorMessage: "Company name must not exceed 200 characters!"
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
        .onFail(() => {
          setIsValid(false);
        })
        .onSuccess(() => {
          setIsValid(true);
        })
    }
  }, [infoCompany]);

  const handleSubmit = (event: any) => {
    if(isValid) {
      const companyName = event.target.companyName.value;
      let logo = null;
      if(logos.length > 0) {
        logo = logos[0].file;
      }
      const city = event.target.city.value;
      const address = event.target.address.value;
      const companyModel = event.target.companyModel.value;
      const companyEmployees = event.target.companyEmployees.value;
      const workingTime = event.target.workingTime.value;
      const workOverTime = event.target.workOverTime.value;
      const email = event.target.email.value;
      const phone = event.target.phone.value;
      let description = "";
      if(editorRef.current) {
        description = (editorRef.current as any).getContent();
      }

      // Create FormData
      const formData = new FormData();
      formData.append("companyName", companyName);
      formData.append("logo", logo);
      formData.append("city", city);
      formData.append("address", address);
      formData.append("companyModel", companyModel);
      formData.append("companyEmployees", companyEmployees);
      formData.append("workingTime", workingTime);
      formData.append("workOverTime", workOverTime);
      formData.append("email", email);
      formData.append("phone", phone);
      formData.append("description", description);

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/profile`, {
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
      {infoCompany && (
        <>
          {/* Follower count badge */}
          <div className="mb-[20px] inline-flex items-center gap-[8px] bg-blue-50 text-blue-700 px-[16px] py-[10px] rounded-[8px]">
            <svg className="w-[20px] h-[20px]" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg>
            <span className="font-[600] text-[14px]">
              {followerCount} {followerCount === 1 ? "Follower" : "Followers"}
            </span>
          </div>
          
          <form
            action=""
            className="grid sm:grid-cols-2 grid-cols-1 gap-y-[15px] gap-x-[20px]"
            id="profileForm"
            onSubmit={handleSubmit}
          >
            <div className="sm:col-span-2">
              <label
                htmlFor="companyName"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Company Name *
              </label>
              <input
                type="text"
                name="companyName"
                id="companyName"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCompany.companyName}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="logo"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Logo
              </label>
              <FilePond 
                name="logo"
                labelIdle='<span class="filepond--label-action">+ Upload logo</span>'
                acceptedFileTypes={['image/*']}
                files={logos}
                onupdatefiles={setLogos}
                credits={false}
              />
            </div>
            <div className="">
              <label
                htmlFor="city"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                City
              </label>
              <select
                name="city"
                id="city"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCompany.city}
              >
                <option value="">Select Province/City</option>
                {cityList.map(item => (
                  <option key={item._id} value={item._id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="">
              <label
                htmlFor="address"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Address
              </label>
              <input
                type="text"
                name="address"
                id="address"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCompany.address}
              />
            </div>
            <div className="">
              <label
                htmlFor="companyModel"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Company Model
              </label>
              <input
                type="text"
                name="companyModel"
                id="companyModel"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCompany.companyModel}
              />
            </div>
            <div className="">
              <label
                htmlFor="companyEmployees"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Company Size
              </label>
              <input
                type="text"
                name="companyEmployees"
                id="companyEmployees"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCompany.companyEmployees}
              />
            </div>
            <div className="">
              <label
                htmlFor="workingTime"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Working Hours
              </label>
              <input
                type="text"
                name="workingTime"
                id="workingTime"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCompany.workingTime}
              />
            </div>
            <div className="">
              <label
                htmlFor="workingTime"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Overtime Work
              </label>
              <input
                type="text"
                name="workOverTime"
                id="workOverTime"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCompany.workOverTime}
              />
            </div>
            <div className="">
              <label
                htmlFor="email"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Email *
              </label>
              <div className="flex gap-[10px]">
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="flex-1 h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-gray-400 bg-gray-50"
                  defaultValue={infoCompany.email}
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
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Phone Number
              </label>
              <input
                type="text"
                name="phone"
                id="phone"
                className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
                defaultValue={infoCompany.phone}
              />
            </div>
            <div className="sm:col-span-2">
              <label
                htmlFor="description"
                className="font-[500] text-[14px] text-black mb-[5px]"
              >
                Detailed Description
              </label>
              <EditorMCE
                editorRef={editorRef}
                value={infoCompany.description}
                id="description"
              />
            </div>
            <div className="">
              <button className="px-[20px] h-[48px] rounded-[8px] bg-[#0088FF] font-[700] text-[16px] text-white hover:bg-[#0070d6] cursor-pointer transition-colors duration-200">
                Update
              </button>
            </div>
          </form>
        </>
      )}

      {/* Email Change Modal */}
      {infoCompany && (
        <EmailChangeModal
          isOpen={showEmailModal}
          onClose={() => setShowEmailModal(false)}
          currentEmail={infoCompany.email}
          accountType="company"
        />
      )}
    </>
  )
}