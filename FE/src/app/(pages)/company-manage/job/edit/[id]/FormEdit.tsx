"use client"
import { positionList, workingFormList } from "@/configs/variable"
import { normalizeSkillDisplay, normalizeSkillKey } from "@/utils/skill";
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginImagePreview from 'filepond-plugin-image-preview';
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.css';
import { useRef, useState } from "react";
import dynamic from 'next/dynamic';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast, Toaster } from 'sonner';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { jobFormSchema, type JobFormData } from "@/schemas/job.schema";

const EditorMCE = dynamic(
  () => import("@/app/components/editor/EditorMCE").then(mod => mod.EditorMCE),
  { ssr: false, loading: () => <div className="h-[200px] bg-[#F9F9F9] rounded-[8px] animate-pulse" /> }
);

registerPlugin(FilePondPluginFileValidateType, FilePondPluginImagePreview);

interface FormEditProps {
  id: string;
  initialJobDetail: any;
  initialCityList: any[];
}

export const FormEdit = ({ id, initialJobDetail, initialCityList }: FormEditProps) => {
  const uniqueInitialImages = ((initialJobDetail?.images || []) as string[]).filter(
    (url, index, arr) => arr.indexOf(url) === index
  );
  const [imageItems, setImageItems] = useState<any[]>(
    uniqueInitialImages.map((url: string) => ({ source: url }))
  );
  const editorRef = useRef(null);
  const [locationList] = useState<any[]>(initialCityList);
  const [selectedCities, setSelectedCities] = useState<string[]>(
    initialJobDetail?.locations || []
  );
  const [expirationDate, setExpirationDate] = useState<Date | null>(
    initialJobDetail?.expirationDate ? new Date(initialJobDetail.expirationDate) : null
  );
  const [skills, setSkills] = useState<string[]>(initialJobDetail?.skills || []);
  const [skillInput, setSkillInput] = useState<string>("");
  const [skillsError, setSkillsError] = useState<string>("");

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<JobFormData>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: initialJobDetail?.title || "",
      position: initialJobDetail?.position || positionList[0]?.value || "",
      workingForm: initialJobDetail?.workingForm || workingFormList[0]?.value || "",
      salaryMin: initialJobDetail?.salaryMin || 0,
      salaryMax: initialJobDetail?.salaryMax || 0,
      maxApplications: initialJobDetail?.maxApplications || 0,
      maxApproved: initialJobDetail?.maxApproved || 0,
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

  const handleImagesUpdate = (fileItems: any[]) => {
    const uniqueMap = new Map<string, any>();
    for (const item of fileItems) {
      if (typeof item?.source === "string") {
        uniqueMap.set(`url:${item.source}`, item);
      } else if (item?.file) {
        const f = item.file as File;
        uniqueMap.set(`file:${f.name}:${f.size}:${f.lastModified}`, item);
      }
    }
    setImageItems(Array.from(uniqueMap.values()));
  };

  const toggleLocation = (locationId: string) => {
    setSelectedCities(prev =>
      prev.includes(locationId) ? prev.filter(lid => lid !== locationId) : [...prev, locationId]
    );
  };

  const onSubmit = async (data: JobFormData) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiUrl) { toast.error("API URL is not configured."); return; }

    if (selectedCities.length === 0) { toast.error("Please select at least one location."); return; }
    if (imageItems.length === 0) { toast.error("Please upload at least one image."); return; }
    if (skills.length === 0) {
      setSkillsError("Please enter at least one skill.");
      toast.error("Please enter at least one skill.");
      return;
    }
    setSkillsError("");

    let description = "";
    if (editorRef.current) description = (editorRef.current as any).getContent();

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("salaryMin", data.salaryMin.toString());
    formData.append("salaryMax", data.salaryMax.toString());
    formData.append("maxApplications", data.maxApplications.toString());
    formData.append("maxApproved", data.maxApproved.toString());

    if (expirationDate) {
      const year = expirationDate.getFullYear();
      const month = (expirationDate.getMonth() + 1).toString().padStart(2, '0');
      const day = expirationDate.getDate().toString().padStart(2, '0');
      formData.append("expirationDate", `${year}-${month}-${day}`);
    } else {
      formData.append("expirationDate", "");
    }

    formData.append("position", data.position);
    formData.append("workingForm", data.workingForm);
    formData.append("skills", skills.join(","));
    formData.append("description", description);
    formData.append("locations", JSON.stringify(selectedCities));

    for (const image of imageItems.filter((item) => typeof item?.source !== "string" && item.file)) {
      formData.append("images", image.file);
    }

    const imageOrder = imageItems.map(item => {
      if (typeof item.source === "string") return item.source;
      return "NEW_IMAGE";
    });
    formData.append("imageOrder", JSON.stringify(imageOrder));

    const existingImages = imageItems
      .map((item) => item.source)
      .filter((source): source is string => typeof source === "string")
      .filter((source, index, arr) => arr.indexOf(source) === index);
    formData.append("existingImages", JSON.stringify(existingImages));

    try {
      const res = await fetch(`${apiUrl}/company/job/edit/${id}`, {
        method: "PATCH",
        body: formData,
        credentials: "include",
      });
      const text = await res.text();
      let result: any = null;
      try { result = JSON.parse(text); } catch { result = null; }

      if (!res.ok) { toast.error(`Update failed (${res.status}).`); return; }
      if (result?.code === "error") { toast.error(result.message || "Update failed."); return; }
      if (result?.code === "success") { toast.success(result.message || "Update successful."); return; }
      toast.error("Update failed. Unexpected response.");
    } catch (error) {
      console.error(error);
      toast.error("Unable to update job post. Please try again.");
    }
  };

  return (
    <>
      <Toaster richColors position="top-right" />
      {initialJobDetail && (
        <form className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px]" onSubmit={handleSubmit(onSubmit, (errors) => {
          const firstError = Object.values(errors)[0];
          if (firstError?.message) toast.error(firstError.message as string);
        })}>
          <div className="sm:col-span-2">
            <label htmlFor="title" className="block font-[500] text-[14px] text-black mb-[5px]">Job Title *</label>
            <input type="text" id="title" autoComplete="off"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("title")} />
            {errors.title && <p className="text-red-500 text-[12px] mt-[4px]">{errors.title.message}</p>}
          </div>
          <div className="">
            <label htmlFor="salaryMin" className="block font-[500] text-[14px] text-black mb-[5px]">Minimum Salary (VND) *</label>
            <input type="number" id="salaryMin" placeholder="e.g. 10000000"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("salaryMin", { valueAsNumber: true })} />
            {errors.salaryMin && <p className="text-red-500 text-[12px] mt-[4px]">{errors.salaryMin.message}</p>}
          </div>
          <div className="">
            <label htmlFor="salaryMax" className="block font-[500] text-[14px] text-black mb-[5px]">Maximum Salary (VND) *</label>
            <input type="number" id="salaryMax" placeholder="e.g. 20000000"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("salaryMax", { valueAsNumber: true })} />
            {errors.salaryMax && <p className="text-red-500 text-[12px] mt-[4px]">{errors.salaryMax.message}</p>}
          </div>
          <div className="">
            <label htmlFor="maxApplications" className="block font-[500] text-[14px] text-black mb-[5px]">Max Applications (0 = unlimited)</label>
            <input type="number" id="maxApplications" placeholder="e.g. 100" min="0"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("maxApplications", { valueAsNumber: true })} />
            {errors.maxApplications && <p className="text-red-500 text-[12px] mt-[4px]">{errors.maxApplications.message}</p>}
          </div>
          <div className="">
            <label htmlFor="maxApproved" className="block font-[500] text-[14px] text-black mb-[5px]">Max Approved (0 = unlimited)</label>
            <input type="number" id="maxApproved" placeholder="e.g. 10" min="0"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("maxApproved", { valueAsNumber: true })} />
            {errors.maxApproved && <p className="text-red-500 text-[12px] mt-[4px]">{errors.maxApproved.message}</p>}
          </div>
          <div className="">
            <label htmlFor="expirationDate" className="block font-[500] text-[14px] text-black mb-[5px]">Expiration Date (optional)</label>
            <DatePicker
              selected={expirationDate} onChange={(date: Date | null) => setExpirationDate(date)}
              minDate={new Date()} maxDate={new Date(2099, 11, 31)}
              dateFormat="dd/MM/yyyy" placeholderText="Select date..."
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black cursor-pointer"
              isClearable
            />
          </div>
          <div className="">
            <label htmlFor="position" className="block font-[500] text-[14px] text-black mb-[5px]">Level *</label>
            <select id="position"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("position")}>
              {positionList.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            {errors.position && <p className="text-red-500 text-[12px] mt-[4px]">{errors.position.message}</p>}
          </div>
          <div className="">
            <label htmlFor="workingForm" className="block font-[500] text-[14px] text-black mb-[5px]">Working Form *</label>
            <select id="workingForm"
              className="w-[100%] h-[46px] border border-[#DEDEDE] rounded-[8px] py-[14px] px-[20px] font-[500] text-[14px] text-black focus:border-[#0088FF] focus:ring-2 focus:ring-[#0088FF]/20 transition-all duration-200"
              {...register("workingForm")}>
              {workingFormList.map(item => <option key={item.value} value={item.value}>{item.label}</option>)}
            </select>
            {errors.workingForm && <p className="text-red-500 text-[12px] mt-[4px]">{errors.workingForm.message}</p>}
          </div>

          <div className="sm:col-span-2">
            <p className="block font-[500] text-[14px] text-black mb-[5px]">Job Locations (Select multiple locations) *</p>
            <div className="border border-[#DEDEDE] rounded-[8px] p-[12px] max-h-[200px] overflow-y-auto">
              <div className="flex flex-wrap gap-[8px]">
                {locationList.map(location => (
                  <button key={location._id} type="button" onClick={() => toggleLocation(location._id)}
                    className={`px-[12px] py-[6px] rounded-[20px] text-[13px] border transition-colors cursor-pointer ${
                      selectedCities.includes(location._id)
                        ? "bg-[#0088FF] text-white border-[#0088FF]"
                        : "bg-white text-[#414042] border-[#DEDEDE] hover:border-[#0088FF]"
                    }`}>
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
            <label htmlFor="skills" className="block font-[500] text-[14px] text-black mb-[5px]">Skills *</label>
            <div className="flex flex-wrap gap-[8px] mb-[8px]">
              {skills.map((skill, index) => (
                <span key={index} className="inline-flex items-center gap-[4px] bg-[#0088FF] text-white px-[12px] py-[6px] rounded-full text-[13px]">
                  {skill}
                  <button type="button" onClick={() => setSkills(skills.filter((_, i) => i !== index))} className="hover:text-red-200">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-[8px]">
              <input id="skills" type="text" placeholder="e.g., reactjs, nodejs, mongodb..."
                value={skillInput} onChange={(e) => setSkillInput(e.target.value)} autoComplete="off"
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addSkill(skillInput); setSkillInput(''); } }}
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
            <p className="block font-[500] text-[14px] text-black mb-[5px]">Image List (max 6) *</p>
            <FilePond name="images"
              labelIdle='<span class="filepond--label-action">+ Upload images</span>'
              acceptedFileTypes={['image/*']}
              files={imageItems} onupdatefiles={handleImagesUpdate}
              onreorderfiles={(fileItems) => handleImagesUpdate(fileItems)}
              onwarning={() => toast.error("You can upload at most 6 images.")}
              allowMultiple={true} maxFiles={6} itemInsertLocation="after" credits={false}
              allowReorder={true}
            />
            <p className="text-[12px] text-[#666] mt-[5px]">Max 6 images total. Currently: {imageItems.length}/6</p>
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="description" className="block font-[500] text-[14px] text-black mb-[5px]">Detailed Description</label>
            <EditorMCE editorRef={editorRef} value={initialJobDetail?.description || ""} id="description" />
          </div>

          <div className="sm:col-span-2">
            <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] h-[48px] px-[20px] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed">
              Update
            </button>
          </div>
        </form>
      )}
    </>
  );
};
