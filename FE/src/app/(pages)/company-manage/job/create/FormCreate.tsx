"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { positionList, workingFormList } from "@/configs/variable"
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { useEffect, useRef, useState } from "react";
import { EditorMCE } from "@/app/components/editor/EditorMCE";
import JustValidate from 'just-validate';
import { Toaster, toast } from 'sonner';

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImagePreview
);

export const FormCreate = () => {
  const [images, setImages] = useState<any[]>([]);
  const editorRef = useRef(null);
  const [isValid, setIsValid] = useState<boolean>(false);
  const [cityList, setCityList] = useState<any[]>([]);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);

  // Fetch cities
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/city`)
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          const sorted = data.cityList.sort((a: any, b: any) => 
            a.name.localeCompare(b.name, 'vi')
          );
          setCityList(sorted);
        }
      });
  }, []);

  useEffect(() => {
    const validator = new JustValidate('#jobCreateForm');

    validator
      .addField('#title', [
        {
          rule: 'required',
          errorMessage: "Please enter job title!"
        },
        {
          rule: 'minLength',
          value: 5,
          errorMessage: "Job title must be at least 5 characters!"
        },
        {
          rule: 'maxLength',
          value: 200,
          errorMessage: "Job title must not exceed 200 characters!"
        },
      ])
      .addField('#salaryMin', [
        {
          rule: 'required',
          errorMessage: "Please enter minimum salary!"
        },
        {
          rule: 'minNumber',
          value: 0,
          errorMessage: "Salary must be >= 0"
        },
      ])
      .addField('#salaryMax', [
        {
          rule: 'required',
          errorMessage: "Please enter maximum salary!"
        },
        {
          rule: 'minNumber',
          value: 0,
          errorMessage: "Salary must be >= 0"
        },
      ])
      .onFail(() => {
        setIsValid(false);
      })
      .onSuccess(() => {
        setIsValid(true);
      })
  }, []);

  // Toggle city selection
  const toggleCity = (cityId: string) => {
    setSelectedCities(prev => 
      prev.includes(cityId)
        ? prev.filter(id => id !== cityId)
        : [...prev, cityId]
    );
  };

  const handleSubmit = (event: any) => {
    event.preventDefault();
    
    if(isValid) {
      const title = event.target.title.value;
      const salaryMin = parseInt(event.target.salaryMin.value) || 0;
      const salaryMax = parseInt(event.target.salaryMax.value) || 0;
      const maxApplications = parseInt(event.target.maxApplications.value) || 0;
      const maxApproved = parseInt(event.target.maxApproved.value) || 0;
      const position = event.target.position.value;
      const workingForm = event.target.workingForm.value;
      const technologies = event.target.technologies.value;
      let description = "";
      if(editorRef.current) {
        description = (editorRef.current as any).getContent();
      }

      // Validate max > min
      if (salaryMax < salaryMin) {
        toast.error("Maximum salary must be greater than or equal to minimum salary!");
        return;
      }

      // Validate maxApproved <= maxApplications (when both are set)
      if (maxApplications > 0 && maxApproved > maxApplications) {
        toast.error("Max Approved cannot exceed Max Applications!");
        return;
      }

      // Validate at least 1 city
      if (selectedCities.length === 0) {
        toast.error("Please select at least one city!");
        return;
      }

      // Validate at least 1 image
      if (images.length === 0) {
        toast.error("Please upload at least 1 image for the job posting!");
        return;
      }

      // Create FormData
      const formData = new FormData();
      formData.append("title", title);
      formData.append("salaryMin", salaryMin.toString());
      formData.append("salaryMax", salaryMax.toString());
      formData.append("maxApplications", maxApplications.toString());
      formData.append("maxApproved", maxApproved.toString());
      formData.append("position", position);
      formData.append("workingForm", workingForm);
      formData.append("technologies", technologies);
      formData.append("description", description);
      formData.append("cities", JSON.stringify(selectedCities));

      // Images
      if(images.length > 0) {
        for (const image of images) {
          formData.append("images", image.file);
        }
      }
      // End Images

      fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/job/create`, {
        method: "POST",
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
            event.target.reset();
            setImages([]);
            setSelectedCities([]);
          }
        })
    }
  }

  return (
    <>
      <Toaster richColors position="top-right" />
      <form
        action=""
        className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]"
        id="jobCreateForm"
        onSubmit={handleSubmit}
      >
        <div className="sm:col-span-2">
          <label
            htmlFor="title"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Job Title *
          </label>
          <input
            type="text"
            name="title"
            id="title"
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="">
          <label
            htmlFor="salaryMin"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Minimum Salary (VND) *
          </label>
          <input
            type="number"
            name="salaryMin"
            id="salaryMin"
            placeholder="e.g. 10000000"
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="">
          <label
            htmlFor="salaryMax"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Maximum Salary (VND) *
          </label>
          <input
            type="number"
            name="salaryMax"
            id="salaryMax"
            placeholder="e.g. 20000000"
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="">
          <label
            htmlFor="maxApplications"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Max Applications (0 = unlimited)
          </label>
          <input
            type="number"
            name="maxApplications"
            id="maxApplications"
            placeholder="e.g. 100"
            defaultValue="0"
            min="0"
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="">
          <label
            htmlFor="maxApproved"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Max Approved (0 = unlimited)
          </label>
          <input
            type="number"
            name="maxApproved"
            id="maxApproved"
            placeholder="e.g. 10"
            defaultValue="0"
            min="0"
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="">
          <label
            htmlFor="position"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Level
          </label>
          <select
            name="position"
            id="position"
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
          >
            {positionList.map(item => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        <div className="">
          <label
            htmlFor="workingForm"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Working Form
          </label>
          <select
            name="workingForm"
            id="workingForm"
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
          >
            {workingFormList.map(item => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
        
        {/* Multi-City Selection */}
        <div className="sm:col-span-2">
          <label className="block font-[500] text-[14px] text-black mb-[5px]">
            Job Locations (Select multiple cities)
          </label>
          <div className="border border-[#DEDEDE] rounded-[4px] p-[12px] max-h-[200px] overflow-y-auto">
            <div className="flex flex-wrap gap-[8px]">
              {cityList.map(city => (
                <button
                  key={city._id}
                  type="button"
                  onClick={() => toggleCity(city._id)}
                  className={`px-[12px] py-[6px] rounded-[20px] text-[13px] border transition-colors ${
                    selectedCities.includes(city._id)
                      ? "bg-[#0088FF] text-white border-[#0088FF]"
                      : "bg-white text-[#414042] border-[#DEDEDE] hover:border-[#0088FF]"
                  }`}
                >
                  {city.name}
                </button>
              ))}
            </div>
          </div>
          {selectedCities.length > 0 && (
            <p className="text-[12px] text-[#666] mt-[4px]">
              Selected: {selectedCities.length} {selectedCities.length === 1 ? "city" : "cities"}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="technologies"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Technologies (comma separated)
          </label>
          <input
            type="text"
            name="technologies"
            id="technologies"
            placeholder="e.g. React, Node.js, MongoDB"
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[4px] py-[14px] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="images"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Image List (max 6)
          </label>
          <FilePond 
            name="logo"
            labelIdle='<span class="filepond--label-action">+ Add images (max 6)</span>'
            acceptedFileTypes={['image/*']}
            files={images}
            onupdatefiles={setImages}
            allowMultiple={true}
            maxFiles={6}
            credits={false}
          />
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="description"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Detailed Description
          </label>
          <EditorMCE
            editorRef={editorRef}
            value=""
            id="description"
          />
        </div>
        <div className="sm:col-span-2">
          <button className="bg-[#0088FF] rounded-[4px] h-[48px] px-[20px] font-[700] text-[16px] text-white">
            Create
          </button>
        </div>
      </form>
    </>
  )
}