/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { positionList, workingFormList } from "@/configs/variable";
import Link from "next/link";
import { FaBriefcase, FaLocationDot, FaUserTie } from "react-icons/fa6";
import { FormApply } from "./FormApply";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/app/components/gallery/ImageGallery";
import { SaveJobButton } from "@/app/components/button/SaveJobButton";

export default async function JobDetailPage(props: PageProps<'/job/detail/[slug]'>) {
  const { slug } = await props.params;

  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/detail/${slug}`);
  const data = await res.json();

  let jobDetail: any = null;

  if(data.code == "success") {
    jobDetail = data.jobDetail;
    jobDetail.position = positionList.find(pos => pos.value == jobDetail.position)?.label;
    jobDetail.workingForm = workingFormList.find(work => work.value == jobDetail.workingForm)?.label;
  } else {
    // Job not found - show 404
    notFound();
  }

  return (
    <>
      {/* Job Detail */}
      {jobDetail && (
        <div className="pt-[30px] pb-[60px]">
          <div className="container">
            {/* Wrap */}
            <div className="flex flex-wrap gap-[20px]">
              {/* Left */}
              <div className="lg:w-[65%] w-[100%]">
                {/* Job Information */}
                <div className="rounded-[8px] bg-white border border-[#DEDEDE] p-[20px]">
                  <h1 className="mb-[10px] font-[700] sm:text-[28px] text-[24px] text-[#121212]">
                    {jobDetail.title}
                  </h1>
                  <div className="mb-[10px] font-[400] text-[16px] text-[#414042]">
                    {jobDetail.companyName}
                  </div>
                  <div className="sm:mb-[20px] mb-[10px] font-[700] text-[20px] text-[#0088FF]">
                    {(jobDetail.salaryMin || 0).toLocaleString("vi-VN")} VND - {(jobDetail.salaryMax || 0).toLocaleString("vi-VN")} VND
                  </div>
                  
                  {/* Warning when job is full or expired */}
                  {(jobDetail.isExpired || jobDetail.isFull || (jobDetail.maxApplications > 0 && jobDetail.applicationCount >= jobDetail.maxApplications)) && (
                    <div className="mb-[16px] p-[12px] bg-amber-50 border border-amber-200 rounded-[4px] text-amber-700 text-[14px]">
                      {jobDetail.isExpired 
                        ? "⚠️ This job posting has expired." 
                        : "⚠️ This position is no longer accepting applications."}
                    </div>
                  )}
                  
                  {/* Expiration Date Info */}
                  {jobDetail.expirationDate && !jobDetail.isExpired && (
                    <div className="mb-[16px] flex items-center gap-[8px] text-[14px]">
                      <span className="text-[#666]">Deadline:</span>
                      <span className="font-[600] text-[#121212]">
                        {new Date(jobDetail.expirationDate).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      </span>
                      {(() => {
                        const diffDays = Math.ceil((new Date(jobDetail.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                        if (diffDays <= 3) return <span className="text-red-500 font-[600]">({diffDays} day{diffDays > 1 ? "s" : ""} left!)</span>;
                        if (diffDays <= 7) return <span className="text-orange-500 font-[600]">({diffDays} days left)</span>;
                        return <span className="text-green-600">({diffDays} days left)</span>;
                      })()}
                    </div>
                  )}
                  
                  {/* Apply and Save buttons */}
                  <div className="flex items-center gap-[12px] mb-[20px]">
                    {jobDetail.isExpired || jobDetail.isFull || (jobDetail.maxApplications > 0 && jobDetail.applicationCount >= jobDetail.maxApplications) ? (
                      <div className="flex-1 flex items-center justify-center h-[48px] rounded-[4px] bg-gray-300 font-[700] text-[16px] text-gray-500 cursor-not-allowed">
                        {jobDetail.isExpired ? "Expired" : "Applications Closed"}
                      </div>
                    ) : (
                      <Link
                        href="#boxFormApply"
                        className="flex-1 flex items-center justify-center h-[48px] rounded-[4px] bg-[#0088FF] font-[700] text-[16px] text-white"
                      >
                        Apply Now
                      </Link>
                    )}
                    <SaveJobButton jobId={jobDetail.id} />
                  </div>
                  {jobDetail.images && jobDetail.images.length > 0 && (
                    <ImageGallery images={jobDetail.images} />
                  )}
                  <div className="flex items-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[10px]">
                    <FaUserTie className="text-[16px]" /> {jobDetail.position}
                  </div>
                  <div className="flex items-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[10px]">
                    <FaBriefcase className="text-[16px]" /> {jobDetail.workingForm}
                  </div>
                  <div className="flex items-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[10px]">
                    <FaLocationDot className="text-[16px]" /> 
                    {jobDetail.jobCities && jobDetail.jobCities.length > 0 
                      ? jobDetail.jobCities.join(", ")
                      : (jobDetail.companyCity || "Remote")}
                  </div>
                  <div className="flex flex-wrap items-center gap-[8px]">
                    {(jobDetail.technologySlugs || []).map((itemTech: string, indexTech: number) => (
                      <div 
                        className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]"
                        key={indexTech}
                      >
                        {itemTech}
                      </div>
                    ))}
                  </div>
                  {/* Application Stats */}
                  <div className="mt-[20px] pt-[20px] border-t border-[#DEDEDE]">
                    <h3 className="font-[600] text-[16px] text-[#121212] mb-[12px]">
                      📊 Application Statistics
                    </h3>
                    <div className="grid grid-cols-2 gap-[12px]">
                      <div className="bg-[#F6F6F6] rounded-[8px] p-[12px] text-center">
                        <div className="font-[700] text-[24px] text-[#0088FF]">
                          {jobDetail.applicationCount || 0}
                          {jobDetail.maxApplications > 0 && (
                            <span className="text-[14px] text-[#666]">/{jobDetail.maxApplications}</span>
                          )}
                        </div>
                        <div className="font-[400] text-[12px] text-[#666]">
                          Applications
                          {jobDetail.maxApplications === 0 && " (Unlimited)"}
                        </div>
                      </div>
                      <div className="bg-[#F6F6F6] rounded-[8px] p-[12px] text-center">
                        <div className="font-[700] text-[24px] text-[#47BE02]">
                          {jobDetail.approvedCount || 0}
                          {jobDetail.maxApproved > 0 && (
                            <span className="text-[14px] text-[#666]">/{jobDetail.maxApproved}</span>
                          )}
                        </div>
                        <div className="font-[400] text-[12px] text-[#666]">
                          Approved
                          {jobDetail.maxApproved === 0 && " (Unlimited)"}
                        </div>
                      </div>
                    </div>
                    {jobDetail.maxApproved > 0 && (
                      <div className="mt-[12px]">
                        {jobDetail.isFull ? (
                          <div className="bg-red-100 text-red-700 rounded-[8px] p-[12px] text-center font-[600]">
                            ⛔ Positions Filled - No longer accepting applications
                          </div>
                        ) : (
                          <div className="bg-green-100 text-green-700 rounded-[8px] p-[12px] text-center font-[600]">
                            ✅ {jobDetail.maxApproved - (jobDetail.approvedCount || 0)} positions remaining
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* End Job Information */}
                {/* Detailed Description */}
                <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
                  <div dangerouslySetInnerHTML={{ __html: jobDetail.description }} />
                </div>
                {/* End Detailed Description */}
                {/* Application Form */}
                <div id="boxFormApply" className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
                  {jobDetail.isExpired || jobDetail.isFull || (jobDetail.maxApplications > 0 && jobDetail.applicationCount >= jobDetail.maxApplications) ? (
                    <div className="text-center py-[20px]">
                      <div className="bg-red-100 border border-red-400 text-red-700 px-[20px] py-[16px] rounded-[8px]">
                        <h2 className="font-[700] text-[20px] mb-[8px]">
                          {jobDetail.isExpired 
                            ? "Job Expired" 
                            : jobDetail.isFull 
                              ? "Positions Filled" 
                              : "Applications Closed"}
                        </h2>
                        <p className="text-[14px]">
                          {jobDetail.isExpired 
                            ? "This job posting has expired and is no longer accepting applications."
                            : jobDetail.isFull 
                              ? "This job has reached the maximum number of approved applications."
                              : "This job has reached the maximum number of applications."}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <h2 className="font-[700] text-[20px] text-black mb-[20px]">
                        Apply Now
                      </h2>
                      <FormApply jobId={jobDetail.id} />
                    </>
                  )}
                </div>
                {/* End Application Form */}
              </div>
              {/* Right */}
              <div className="flex-1">
                {/* Company Information */}
                <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
                  <div className="flex gap-[12px]">
                    <div className="w-[100px] aspect-square rounded-[4px]">
                      <img
                        src={jobDetail.companyLogo}
                        alt={jobDetail.companyName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-[700] text-[18px] text-[#121212] mb-[10px]">
                        {jobDetail.companyName}
                      </div>
                      <Link
                        href={`/company/detail/${jobDetail.companySlug}`}
                        className="flex items-center gap-[8px] font-[400] text-[16px] text-[#0088FF]"
                      >
                        View Company <i className="fa-solid fa-arrow-right-long text-[16px]" />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-[20px] flex flex-col gap-[10px]">
                    <div className="flex items-center justify-between">
                      <div className="font-[400] text-[16px] text-[#A6A6A6]">
                        Company Model
                      </div>
                      <div className="font-[400] text-[16px] text-[#121212]">
                        {jobDetail.companyModel}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-[400] text-[16px] text-[#A6A6A6]">
                        Company Size
                      </div>
                      <div className="font-[400] text-[16px] text-[#121212]">
                        {jobDetail.companyEmployees}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-[400] text-[16px] text-[#A6A6A6]">
                        Working Hours
                      </div>
                      <div className="font-[400] text-[16px] text-[#121212]">
                        {jobDetail.workingTime}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="font-[400] text-[16px] text-[#A6A6A6]">
                        Overtime Work
                      </div>
                      <div className="font-[400] text-[16px] text-[#121212]">
                        {jobDetail.workOverTime}
                      </div>
                    </div>
                  </div>
                </div>
                {/* End Company Information */}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* End Job Detail */}
    </>
  )
}