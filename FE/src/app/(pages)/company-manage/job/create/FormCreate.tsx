"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { positionList, workingFormList } from "@/configs/variable"
import { slugify } from "@/utils/slugify";
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { useEffect, useRef, useState } from "react";
import dynamic from 'next/dynamic';
import JustValidate from 'just-validate';
import { Toaster, toast } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

// Lazy load TinyMCE to reduce bundle size
const EditorMCE = dynamic(
  () => import("@/app/components/editor/EditorMCE").then(mod => mod.EditorMCE),
  { ssr: false, loading: () => <div className="h-[200px] bg-[#F9F9F9] rounded-[8px] animate-pulse" /> }
);

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
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [technologies, setTechnologies] = useState<string[]>([]);
  const [techInput, setTechInput] = useState<string>("");

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

      // Expiration date (optional) - DatePicker handles validation via minDate/maxDate
      if (expirationDate) {
        // Format Date to YYYY-MM-DD for backend
        const year = expirationDate.getFullYear();
        const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
        const day = expirationDate.getDate().toString().padStart(2, '0');
        formData.append("expirationDate", `${year}-${month}-${day}`);
      }

      formData.append("position", position);
      formData.append("workingForm", event.target.workingForm.value);
      formData.append("technologies", technologies.join(","));
      formData.append("description", description);
      formData.append("cities", JSON.stringify(selectedCities));

      // Images
      if(images.length > 0) {
        for (const image of images) {
          if (image.file) {
            formData.append("images", image.file);
          }
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
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
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
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
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
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
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
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
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
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
          />
        </div>
        <div className="">
          <label
            htmlFor="expirationDate"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Expiration Date (optional)
          </label>
          <DatePicker
            selected={expirationDate}
            onChange={(date: Date | null) => setExpirationDate(date)}
            minDate={new Date()}
            maxDate={new Date(2099, 11, 31)}
            dateFormat="dd/MM/yyyy"
            placeholderText="Select date..."
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black cursor-pointer"
            isClearable
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
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
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
            className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
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
          <div className="border border-[#DEDEDE] rounded-[8px] p-[12px] max-h-[200px] overflow-y-auto">
            <div className="flex flex-wrap gap-[8px]">
              {cityList.map(city => (
                <button
                  key={city._id}
                  type="button"
                  onClick={() => toggleCity(city._id)}
                  className={`px-[12px] py-[6px] rounded-[20px] text-[13px] border transition-colors cursor-pointer ${
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
            Technologies
          </label>
          <div className="flex flex-wrap gap-[8px] mb-[8px]">
            {technologies.map((tech, index) => (
              <span 
                key={index}
                className="inline-flex items-center gap-[4px] bg-[#0088FF] text-white px-[12px] py-[6px] rounded-full text-[13px]"
              >
                {tech}
                <button
                  type="button"
                  onClick={() => setTechnologies(technologies.filter((_, i) => i !== index))}
                  className="hover:text-red-200"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-[8px]">
            <input
              type="text"
              placeholder="e.g., reactjs, nodejs, mongodb..."
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault();
                  const cleanInput = techInput.replace(/[,]/g, '').trim();
                  if (cleanInput) {
                    const newTech = slugify(cleanInput);
                    setTechInput('');
                    if (newTech && !technologies.includes(newTech)) {
                      setTechnologies([...technologies, newTech]);
                    }
                  }
                }
              }}
              className="flex-1 h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => {
                const cleanInput = techInput.replace(/,/g, '').trim();
                const newTech = slugify(cleanInput);
                setTechInput('');
                if (newTech && !technologies.includes(newTech)) {
                  setTechnologies([...technologies, newTech]);
                }
              }}
              className="px-[16px] h-[46px] bg-[#E0E0E0] rounded-[8px] font-[600] text-[14px] hover:bg-[#D0D0D0] cursor-pointer transition-colors duration-200"
            >
              Add
            </button>
          </div>
          <p className="text-[#999] text-[12px] mt-[5px]">Press Enter or comma to add technologies</p>
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
          <button className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] h-[48px] px-[20px] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]">
            Create
          </button>
        </div>
      </form>
    </>
  )
}