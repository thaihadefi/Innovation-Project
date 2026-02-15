"use client"
import { positionList, workingFormList } from "@/configs/variable"
import { normalizeSkillDisplay, normalizeSkillKey } from "@/utils/skill";
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

interface FormCreateProps {
  initialCityList: any[];
}

export const FormCreate = ({ initialCityList }: FormCreateProps) => {
  const [imageItems, setImageItems] = useState<any[]>([]);
  const editorRef = useRef(null);
  const validatorRef = useRef<InstanceType<typeof JustValidate> | null>(null);
  const [locationList] = useState<any[]>(initialCityList);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [expirationDate, setExpirationDate] = useState<Date | null>(null);
  const [skills, setSkills] = useState<string[]>([]);
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
  const handleImagesUpdate = (fileItems: any[]) => {
    const uniqueMap = new Map<string, any>();
    for (const item of fileItems) {
      if (item?.file) {
        const f = item.file as File;
        uniqueMap.set(`file:${f.name}:${f.size}:${f.lastModified}`, item);
      }
    }
    setImageItems(Array.from(uniqueMap.values()));
  };

  useEffect(() => {
    const validator = new JustValidate('#jobCreateForm');
    validatorRef.current = validator;

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
      .addField('#position', [
        {
          rule: 'required',
          errorMessage: "Please select a level!"
        }
      ])
      .addField('#workingForm', [
        {
          rule: 'required',
          errorMessage: "Please select a working form!"
        }
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
      .onFail(() => {})
      .onSuccess(() => {})
  }, []);

  // Toggle location selection
  const toggleLocation = (locationId: string) => {
    setSelectedCities(prev => 
      prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId]
    );
  };

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    
    const validator = validatorRef.current;
    if (!validator) {
      toast.error("Validator not initialized.");
      return;
    }

    const isFormValid = await validator.revalidate();
    if (!isFormValid) {
      return;
    }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        toast.error("API URL is not configured.");
        return;
      }
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
        toast.error("Maximum salary must be greater than or equal to minimum salary.");
        return;
      }

      // Validate maxApproved <= maxApplications (when both are set)
      if (maxApplications > 0 && maxApproved > maxApplications) {
        toast.error("Max Approved cannot exceed Max Applications.");
        return;
      }

      // Validate at least 1 location
      if (selectedCities.length === 0) {
        toast.error("Please select at least one location.");
        return;
      }

      // Validate at least 1 image
      if (imageItems.length === 0) {
        toast.error("Please upload at least 1 image for the job posting.");
        return;
      }

      // Validate at least 1 skill
      if (skills.length === 0) {
        toast.error("Please enter at least one skill.");
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
      formData.append("skills", skills.join(","));
      formData.append("description", description);
      formData.append("locations", JSON.stringify(selectedCities));

      // Images
      const newImages = imageItems.filter(
        (item) => typeof item?.source !== "string" && item.file
      );
      if(newImages.length > 0) {
        for (const image of newImages) {
          if (image.file) {
            formData.append("images", image.file);
          }
        }
      }
      // End Images

      fetch(`${apiUrl}/company/job/create`, {
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
            setImageItems([]);
            setSelectedCities([]);
            setSkills([]);
            setSkillInput("");
            setExpirationDate(null);
            if (editorRef.current) {
              (editorRef.current as any).setContent("");
            }
          }
        })
        .catch(() => {
          toast.error("Failed to create. Please try again.");
        })
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
            Level *
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
            Working Form *
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
        
        {/* Multi-Location Selection */}
        <div className="sm:col-span-2">
          <label className="block font-[500] text-[14px] text-black mb-[5px]">
            Job Locations (Select multiple locations) *
          </label>
          <div className="border border-[#DEDEDE] rounded-[8px] p-[12px] max-h-[200px] overflow-y-auto">
            <div className="flex flex-wrap gap-[8px]">
              {locationList.map(location => (
                <button
                  key={location._id}
                  type="button"
                  onClick={() => toggleLocation(location._id)}
                  className={`px-[12px] py-[6px] rounded-[20px] text-[13px] border transition-colors cursor-pointer ${
                    selectedCities.includes(location._id)
                      ? "bg-[#0088FF] text-white border-[#0088FF]"
                      : "bg-white text-[#414042] border-[#DEDEDE] hover:border-[#0088FF]"
                  }`}
                >
                  {location.name}
                </button>
              ))}
            </div>
          </div>
          {selectedCities.length > 0 && (
            <p className="text-[12px] text-[#666] mt-[4px]">
              Selected: {selectedCities.length} {selectedCities.length === 1 ? "location" : "locations"}
            </p>
          )}
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="skills"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Skills *
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
              type="text"
              placeholder="e.g., reactjs, nodejs, mongodb..."
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault();
                    addSkill(skillInput);
                    setSkillInput('');
                  }
                }}
              className="flex-1 h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => {
                addSkill(skillInput);
                setSkillInput('');
              }}
              className="px-[16px] h-[46px] bg-[#E0E0E0] rounded-[8px] font-[600] text-[14px] hover:bg-[#D0D0D0] cursor-pointer transition-colors duration-200"
            >
              Add
            </button>
          </div>
          <p className="text-[#999] text-[12px] mt-[5px]">Press Enter or comma to add skills</p>
        </div>
        <div className="sm:col-span-2">
          <label
            htmlFor="images"
            className="block font-[500] text-[14px] text-black mb-[5px]"
          >
            Image List (max 6) *
          </label>
          
          {/* Upload New Images */}
          <FilePond 
            name="images"
            labelIdle='<span class="filepond--label-action">+ Upload images</span>'
            acceptedFileTypes={['image/*']}
            files={imageItems}
            onupdatefiles={handleImagesUpdate}
            onwarning={() => {
              toast.error("You can upload at most 6 images.");
            }}
            allowMultiple={true}
            maxFiles={6}
            itemInsertLocation="after"
            credits={false}
          />
          <p className="text-[12px] text-[#666] mt-[5px]">
            Max 6 images total. Currently: {imageItems.length}/6
          </p>
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
