import { CompanyLogoImage } from "@/app/components/ui/CompanyLogoImage";
import { positionList, workingFormList } from "@/configs/variable";
import Link from "next/link";
import { FaBriefcase, FaLocationDot, FaUserTie } from "react-icons/fa6";
import { FaChartBar, FaCheckCircle, FaBan, FaExclamationTriangle } from "react-icons/fa";
import { FormApply } from "./FormApply";
import { notFound } from "next/navigation";
import { ImageGallery } from "@/app/components/gallery/ImageGallery";
import { SaveJobButton } from "@/app/components/button/SaveJobButton";
import { cookies } from "next/headers";
import { SanitizedHTML } from "@/app/components/common/SanitizedHTML";
import { formatDateVN } from "@/utils/date";
import { formatSalaryRangeVN } from "@/utils/currency";

import { getServerApiUrl } from "@/utils/get-server-api-url";
import type { JobCard } from "@/types/job";

type JobDetail = JobCard & {
  maxApplications: number;
  maxApproved: number;
  applicationCount: number;
  approvedCount: number;
  companySlug?: string;
  companyModel?: string;
  companyEmployees?: string;
  workingTime?: string;
  workOverTime?: string;
  description?: string;
  images?: string[];
};

export default async function JobDetailPage(props: PageProps<'/job/detail/[slug]'>) {
  const { slug } = await props.params;
  
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  const apiUrl = getServerApiUrl();
  
  const res = await fetch(`${apiUrl}/job/detail/${slug}`, {
    headers: token ? { Cookie: `token=${token}` } : {},
    cache: "no-store"
  });
  const data = await res.json();

  let jobDetail: JobDetail | null = null;

  if(data.code == "success" && data.jobDetail) {
    jobDetail = {
      ...data.jobDetail,
      maxApplications: data.jobDetail.maxApplications ?? 0,
      maxApproved: data.jobDetail.maxApproved ?? 0,
      applicationCount: data.jobDetail.applicationCount ?? 0,
      approvedCount: data.jobDetail.approvedCount ?? 0,
    } as JobDetail;
    jobDetail.position = positionList.find(pos => pos.value == jobDetail!.position)?.label;
    jobDetail.workingForm = workingFormList.find(work => work.value == jobDetail!.workingForm)?.label;
  }

  if (!jobDetail) {
    notFound();
  }

  let initialSaved = false;
  let isCompanyViewer = false;
  
  if (token) {
    try {
      const authRes = await fetch(
        `${apiUrl}/auth/check`,
        { 
          headers: { Cookie: `token=${token}` },
          cache: "no-store"
        }
      );
      const authData = await authRes.json();
      if (authData.code === "success" && authData.infoCompany) {
        if (jobDetail?.companyId && authData.infoCompany?.id?.toString() === jobDetail.companyId?.toString()) {
          isCompanyViewer = true;
        } else {
          isCompanyViewer = false;
        }
      } else if (authData.code === "success" && authData.infoCandidate) {
        const saveRes = await fetch(
          `${apiUrl}/candidate/job/save/check/${jobDetail.id}`,
          { 
            headers: { Cookie: `token=${token}` },
            cache: "no-store"
          }
        );
        const saveData = await saveRes.json();
        if (saveData.code === "success") {
          initialSaved = saveData.saved;
        }
      }
    } catch { /* keep fallback values on error */ }
  }

  return (
    <>
      
      {jobDetail && (
        <div className="pt-[30px] pb-[60px]">
          <div className="container">
            
            <div className="flex flex-wrap gap-[20px]">
              
              <div className="lg:w-[65%] w-[100%]">
                
                <div className="rounded-[8px] bg-white border border-[#DEDEDE] p-[20px]">
                  <h1 className="mb-[10px] font-[700] text-[24px] sm:text-[28px] text-[#121212]">
                    {jobDetail.title}
                  </h1>
                  <div className="mb-[10px] font-[400] text-[16px] text-[#414042]">
                    {jobDetail.companyName}
                  </div>
                  <div className="mb-[10px] sm:mb-[20px] font-[700] text-[20px] text-[#0088FF]">
                    {formatSalaryRangeVN(jobDetail.salaryMin, jobDetail.salaryMax)}
                  </div>
                  
                  
                  {(jobDetail.isExpired || jobDetail.isFull || (jobDetail.maxApplications > 0 && jobDetail.applicationCount >= jobDetail.maxApplications)) && (
                    <div className="mb-[16px] p-[12px] bg-amber-50 border border-amber-200 rounded-[4px] text-amber-700 text-[14px] flex items-center gap-2">
                      <FaExclamationTriangle />
                      {jobDetail.isExpired 
                        ? "This job posting has expired." 
                        : "This position is no longer accepting applications."}
                    </div>
                  )}
                  
                  
                  {jobDetail.expirationDate && !jobDetail.isExpired && (
                    <div className="mb-[16px] flex items-center gap-[8px] text-[14px]">
                      <span className="text-[#666]">Deadline:</span>
                      <span className="font-[600] text-[#121212]">
                        {formatDateVN(jobDetail.expirationDate)}
                      </span>
                      {(() => {
                        const expDate = new Date(jobDetail.expirationDate);
                        const now = new Date();
                        const expUTC = Date.UTC(expDate.getUTCFullYear(), expDate.getUTCMonth(), expDate.getUTCDate());
                        const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
                        const diffDays = Math.ceil((expUTC - nowUTC) / (1000 * 60 * 60 * 24));
                        if (diffDays <= 3) return <span className="text-red-500 font-[600]">({diffDays} day{diffDays > 1 ? "s" : ""} left!)</span>;
                        if (diffDays <= 7) return <span className="text-orange-500 font-[600]">({diffDays} days left)</span>;
                        return <span className="text-green-600">({diffDays} days left)</span>;
                      })()}
                    </div>
                  )}
                  
                  
                  <div className="flex items-center gap-[12px] mb-[20px]">
                    {jobDetail.isExpired || jobDetail.isFull || (jobDetail.maxApplications > 0 && jobDetail.applicationCount >= jobDetail.maxApplications) ? (
                      <div className="flex-1 flex items-center justify-center h-[48px] rounded-[4px] bg-gray-300 font-[700] text-[16px] text-gray-500 cursor-not-allowed">
                        {jobDetail.isExpired ? "Expired" : "Applications Closed"}
                      </div>
                    ) : (
                      <Link
                        href="#boxFormApply"
                        className="flex-1 flex items-center justify-center h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                      >
                        Apply Now
                      </Link>
                    )}
                    <SaveJobButton jobId={jobDetail.id ?? ""} initialSaved={initialSaved} isCompanyViewer={isCompanyViewer} />
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
                    {jobDetail.jobLocations && jobDetail.jobLocations.length > 0 
                      ? jobDetail.jobLocations.join(", ")
                      : (jobDetail.companyLocation || "Remote")}
                  </div>
                  <div className="flex flex-wrap items-center gap-[8px]">
                    {(jobDetail.skills || []).map((itemSkill: string, indexSkill: number) => (
                      <Link
                        href={{ pathname: "/search", query: { skill: itemSkill } }}
                        className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042] hover:border-[#0088FF] hover:text-[#0088FF] cursor-pointer transition-colors duration-200"
                        key={indexSkill}
                      >
                        {itemSkill}
                      </Link>
                    ))}
                  </div>
                  
                  <div className="mt-[20px] pt-[20px] border-t border-[#DEDEDE]">
                    <h3 className="font-[600] text-[16px] text-[#121212] mb-[12px] flex items-center gap-2">
                      <FaChartBar className="text-[#0088FF]" /> Application Statistics
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
                          <div className="bg-red-100 text-red-700 rounded-[8px] p-[12px] text-center font-[600] flex items-center justify-center gap-2">
                            <FaBan /> Positions Filled - No longer accepting applications
                          </div>
                        ) : (
                          <div className="bg-green-100 text-green-700 rounded-[8px] p-[12px] text-center font-[600] flex items-center justify-center gap-2">
                            <FaCheckCircle /> {jobDetail.maxApproved - (jobDetail.approvedCount || 0)} positions remaining
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                
                <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
                  <SanitizedHTML html={jobDetail.description ?? ""} />
                </div>
                
                
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
                      <div className="mb-[16px] p-[12px] bg-[#F5F7FF] border border-[#D6E0FF] rounded-[8px] text-[14px] text-[#2B3A67]">
                        Need help preparing a CV? See tips from Harvard Career Services.{" "}
                        <Link
                          href="https://careerservices.fas.harvard.edu/channels/create-a-resume-cv-or-cover-letter/"
                          target="_blank"
                          rel="noreferrer"
                          className="font-[600] text-[#0088FF] hover:underline"
                        >
                          View guide →
                        </Link>
                      </div>
                      <FormApply jobId={jobDetail.id ?? ""} isCompanyViewer={isCompanyViewer} />
                    </>
                  )}
                </div>
                
              </div>
              
              <div className="flex-1">
                
                <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
                  <div className="flex gap-[12px]">
                    <div className="w-[100px] aspect-square rounded-[4px] bg-[#F6F6F6] overflow-hidden">
                      <CompanyLogoImage
                        src={jobDetail.companyLogo}
                        alt={jobDetail.companyName || "Logo"}
                        width={100}
                        height={100}
                        className="w-full h-full object-contain"
                        priority
                      />
                    </div>
                    <div className="flex-1">
                      <div className="font-[700] text-[18px] text-[#121212] mb-[10px]">
                        {jobDetail.companyName}
                      </div>
                      <Link
                        href={`/company/detail/${jobDetail.companySlug}`}
                        className="flex items-center gap-[8px] font-[400] text-[16px] text-[#0088FF] hover:underline transition-colors duration-200"
                      >
                        View Company →
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
                
              </div>
            </div>
          </div>
        </div>
      )}
      
    </>
  )
}
