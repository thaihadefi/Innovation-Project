"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { FaArrowLeft, FaDownload, FaCircleCheck, FaCircleXmark, FaClock } from 'react-icons/fa6';
import Link from "next/link";
import { cvStatusList } from "@/configs/variable";
import { CVDetailSkeleton } from "@/app/components/ui/Skeleton";

export const CVViewer = ({ cvId }: { cvId: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cvDetail, setCvDetail] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/detail/${cvId}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setCvDetail(data.cvDetail);
        } else {
          toast.error(data.message);
          router.push("/candidate-manage/cv/list");
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load CV details");
        setLoading(false);
      });
  }, [cvId, router]);

  // Download PDF with proper .pdf extension
  const handleDownload = async () => {
    if (!cvDetail?.fileCV) return;
    
    setDownloading(true);
    try {
      const response = await fetch(cvDetail.fileCV);
      const blob = await response.blob();
      
      // Create download link
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

  if (loading) {
    return <CVDetailSkeleton />;
  }

  if (!cvDetail) {
    return null;
  }

  // Convert Cloudinary URL to embedded PDF viewer URL
  // Cloudinary raw files can be embedded in iframe with Google Docs Viewer
  const pdfUrl = cvDetail.fileCV;
  const googleViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(pdfUrl)}&embedded=true`;

  // Get current status info
  const currentStatus = cvStatusList.find(s => s.value === cvDetail.status);

  // Status message and icon based on application status
  const getStatusMessage = () => {
    switch (cvDetail.status) {
      case "approved":
        return {
          icon: <FaCircleCheck className="text-[48px] text-[#47BE02]" />,
          title: "Congratulations! Your application has been approved!",
          message: "The company has reviewed your application and decided to move forward with you. They will contact you soon via email or phone for the next steps.",
          bgColor: "#e8f5e9",
          borderColor: "#47BE02"
        };
      case "rejected":
        return {
          icon: <FaCircleXmark className="text-[48px] text-[#FF5100]" />,
          title: "Thank you for your interest",
          message: "We appreciate you taking the time to apply. After careful consideration, we regret to inform you that we will not be proceeding with your application at this time. We encourage you to continue exploring other opportunities.",
          bgColor: "#ffebee",
          borderColor: "#FF5100"
        };
      case "viewed":
        return {
          icon: <FaCircleCheck className="text-[48px] text-[#0088FF]" />,
          title: "The company has viewed your application!",
          message: "Good news! The employer has opened and reviewed your CV. They are considering your application. Please wait for their decision.",
          bgColor: "#e3f2fd",
          borderColor: "#0088FF"
        };
      default: // initial/pending
        return {
          icon: <FaClock className="text-[48px] text-[#FFB200]" />,
          title: "Your application is being reviewed",
          message: "The company has received your application and is currently reviewing it. Please wait for their response.",
          bgColor: "#fff8e1",
          borderColor: "#FFB200"
        };
    }
  };

  const statusInfo = getStatusMessage();

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
        <div className="flex items-center gap-[16px]">
          <Link
            href="/candidate-manage/cv/list"
            className="inline-flex items-center gap-[8px] text-[#0088FF] hover:underline"
          >
            <FaArrowLeft /> Back
          </Link>
          <div>
            <h1 className="font-[700] text-[20px] text-[#121212]">
              View Application
            </h1>
            <p className="text-[#666] text-[14px]">
              Applied for: <Link href={`/job/detail/${cvDetail.jobSlug}`} className="font-[600] text-[#0088FF] hover:underline">{cvDetail.jobTitle}</Link>
            </p>
          </div>
        </div>
        <div className="flex gap-[10px]">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="inline-flex items-center gap-[8px] bg-[#28a745] text-white px-[16px] py-[10px] rounded-[4px] hover:bg-[#218838] disabled:opacity-50"
          >
            <FaDownload /> {downloading ? "Downloading..." : "Download PDF"}
          </button>
          {cvDetail.status === "initial" && (
            <Link
              href={`/candidate-manage/cv/edit/${cvId}`}
              className="inline-flex items-center gap-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[16px] py-[10px] rounded-[8px] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              Edit Application
            </Link>
          )}
        </div>
      </div>

      {/* Status Message Banner */}
      <div 
        className="text-center py-[24px] px-[20px] rounded-[8px] mb-[20px] border-2"
        style={{ 
          backgroundColor: statusInfo.bgColor,
          borderColor: statusInfo.borderColor
        }}
      >
        <div className="mx-auto mb-[12px] flex justify-center">
          {statusInfo.icon}
        </div>
        <h3 className="font-[700] text-[18px] text-[#121212] mb-[8px]">
          {statusInfo.title}
        </h3>
        <p className="text-[#666] text-[14px] max-w-[600px] mx-auto">
          {statusInfo.message}
        </p>
        <div 
          className="inline-block mt-[12px] px-[16px] py-[4px] rounded-[20px] text-[14px] font-[600]"
          style={{ 
            backgroundColor: `${currentStatus?.color}20`,
            color: currentStatus?.color 
          }}
        >
          Status: {currentStatus?.label}
        </div>
      </div>

      {/* Application Info */}
      <div className="grid md:grid-cols-3 gap-[16px] mb-[20px] p-[16px] bg-[#f9f9f9] rounded-[8px] border border-[#DEDEDE]">
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

      {/* PDF Viewer */}
      <div className="border border-[#DEDEDE] rounded-[8px] overflow-hidden bg-white">
        <div className="bg-[#333] text-white px-[16px] py-[8px] text-[14px]">
          Attached CV
        </div>
        <iframe
          src={googleViewerUrl}
          className="w-full h-[600px]"
          title="CV Preview"
          frameBorder="0"
        />
      </div>
    </div>
  );
};
