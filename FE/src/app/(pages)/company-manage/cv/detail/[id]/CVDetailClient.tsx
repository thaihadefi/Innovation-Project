"use client"
import { positionList, workingFormList, cvStatusList } from "@/configs/variable";
import { useState } from "react";
import Link from "next/link";
import { toast } from 'sonner';
import { FaDownload, FaArrowLeft, FaCheck, FaXmark } from 'react-icons/fa6';

interface CVDetailClientProps {
  cvId: string;
  initialCVDetail: any;
  initialJobDetail: any;
}

export const CVDetailClient = ({ cvId, initialCVDetail, initialJobDetail }: CVDetailClientProps) => {
  const [cvDetail, setCvDetail] = useState<any>(initialCVDetail);
  const [downloading, setDownloading] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Process job detail labels
  const jobDetail = {
    ...initialJobDetail,
    position: positionList.find(pos => pos.value == initialJobDetail?.position)?.label || initialJobDetail?.position,
    workingForm: workingFormList.find(work => work.value == initialJobDetail?.workingForm)?.label || initialJobDetail?.workingForm
  };

  // Download PDF with proper .pdf extension
  const handleDownload = async () => {
    if (!cvDetail?.fileCV) return;
    
    setDownloading(true);
    try {
      const response = await fetch(cvDetail.fileCV);
      const blob = await response.blob();
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${cvDetail.fullName.replace(/\s+/g, '_')}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error(error);
    }
    setDownloading(false);
  };

  // Change application status
  const handleChangeStatus = async (newStatus: string) => {
    if (!cvId) return;
    
    setUpdatingStatus(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/cv/change-status/${cvId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      
      if (data.code === "success") {
        setCvDetail({ ...cvDetail, status: newStatus });
        toast.success(newStatus === "approved" ? "Application approved!" : "Application rejected");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update status");
      console.error(error);
    }
    setUpdatingStatus(false);
  };

  if (!cvDetail || !jobDetail) {
    return (
      <div className="py-[60px]">
        <div className="container text-center text-[#666]">
          Application not found
        </div>
      </div>
    );
  }

  const pdfUrl = cvDetail.fileCV;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;
  const currentStatus = cvStatusList.find(s => s.value === cvDetail.status);

  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
            <div className="flex items-center gap-[16px]">
              <Link href="/company-manage/cv/list" className="inline-flex items-center gap-[8px] text-[#0088FF] hover:underline">
                <FaArrowLeft /> Back to List
              </Link>
              <div>
                <h1 className="font-[700] text-[20px] text-[#121212]">Application Details</h1>
                <p className="text-[#666] text-[14px]">
                  Applied for: <Link href={`/job/detail/${jobDetail.slug}`} className="font-[600] text-[#0088FF] hover:underline">{jobDetail.title}</Link>
                </p>
              </div>
            </div>
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[16px] py-[10px] rounded-[8px] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              <FaDownload /> {downloading ? "Downloading..." : "Download PDF"}
            </button>
          </div>

          {/* Applicant Info with Status */}
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mb-[20px]">
            <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[16px]">
              <div className="flex items-center gap-[12px]">
                <span className="font-[700] text-[18px]">Applicant Information</span>
                {cvDetail.isVerified && (
                  <div className="inline-flex items-center gap-[6px] bg-green-100 text-green-700 px-[10px] py-[4px] rounded-full font-[600] text-[12px]">
                    <svg className="w-[14px] h-[14px]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Verified UIT Student/Alumni
                  </div>
                )}
              </div>
              <div 
                className="px-[12px] py-[4px] rounded-[20px] text-[14px] font-[600]"
                style={{ backgroundColor: `${currentStatus?.color}20`, color: currentStatus?.color }}
              >
                {currentStatus?.label}
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-[16px] mb-[20px]">
              <div>
                <p className="text-[#666] text-[12px]">Full Name</p>
                <p className="font-[600] text-[#121212]">{cvDetail.fullName}</p>
              </div>
              <div>
                <p className="text-[#666] text-[12px]">Email</p>
                <p className="font-[600] text-[#121212]">{cvDetail.email}</p>
              </div>
              <div>
                <p className="text-[#666] text-[12px]">Phone</p>
                <p className="font-[600] text-[#121212]">{cvDetail.phone}</p>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex gap-[12px] pt-[16px] border-t border-[#DEDEDE]">
              <button
                onClick={() => handleChangeStatus("approved")}
                disabled={updatingStatus || cvDetail.status === "approved"}
                className={`inline-flex items-center gap-[8px] px-[20px] py-[10px] rounded-[4px] font-[600] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  cvDetail.status === "approved" 
                    ? "bg-[#47BE02] text-white" 
                    : "bg-[#e8f5e9] text-[#47BE02] hover:bg-[#47BE02] hover:text-white cursor-pointer"
                }`}
              >
                <FaCheck /> {cvDetail.status === "approved" ? "Approved" : "Approve"}
              </button>
              <button
                onClick={() => handleChangeStatus("rejected")}
                disabled={updatingStatus || cvDetail.status === "rejected"}
                className={`inline-flex items-center gap-[8px] px-[20px] py-[10px] rounded-[4px] font-[600] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  cvDetail.status === "rejected" 
                    ? "bg-[#FF5100] text-white" 
                    : "bg-[#ffebee] text-[#FF5100] hover:bg-[#FF5100] hover:text-white cursor-pointer"
                }`}
              >
                <FaXmark /> {cvDetail.status === "rejected" ? "Rejected" : "Reject"}
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="border border-[#DEDEDE] rounded-[8px] overflow-hidden mb-[20px]">
            <div className="bg-[#333] text-white px-[16px] py-[8px] text-[14px]">Attached CV</div>
            <iframe src={googleViewerUrl} className="w-full h-[600px]" title="CV Preview" frameBorder="0" />
          </div>

          {/* Job Information */}
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="font-[700] text-[18px] mb-[16px]">Job Information</div>
            <div className="grid md:grid-cols-2 gap-[12px]">
              <div className="font-[400] text-[16px]">Job Title: <span className="font-[700]">{jobDetail.title}</span></div>
              <div className="font-[400] text-[16px]">Salary: <span className="font-[700]">{jobDetail.salaryMin?.toLocaleString("vi-VN")} VND - {jobDetail.salaryMax?.toLocaleString("vi-VN")} VND</span></div>
              <div className="font-[400] text-[16px]">Level: <span className="font-[700]">{jobDetail.position}</span></div>
              <div className="font-[400] text-[16px]">Working Form: <span className="font-[700]">{jobDetail.workingForm}</span></div>
              <div className="font-[400] text-[16px] md:col-span-2">Technologies: <span className="font-[700]">{jobDetail.technologySlugs?.join(", ") || ""}</span></div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
