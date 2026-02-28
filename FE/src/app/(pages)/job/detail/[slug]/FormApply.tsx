"use client"
import { useEffect, useState } from "react";
import { toast } from 'sonner';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { FaFilePdf, FaCircleCheck } from 'react-icons/fa6';
import Link from "next/link";
import { ApplyFormSkeleton } from "@/app/components/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

export const FormApply = (props: {
  jobId: string;
  isCompanyViewer?: boolean;
}) => {
  const { jobId, isCompanyViewer = false } = props;
  const [cvFile, setCvFile] = useState<any[]>([]);
  const [cvError, setCvError] = useState<string>("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [applicationStatus, setApplicationStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(!isCompanyViewer); // Don't show loading for company
  const [isGuest, setIsGuest] = useState(!isCompanyViewer); // Don't show guest for company
  const [isCompanyViewing, setIsCompanyViewing] = useState(isCompanyViewer); // Use server value
  const [isOtherCompanyViewing, setIsOtherCompanyViewing] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [profileError, setProfileError] = useState("");
  const { infoCandidate, authLoading } = useAuth();

  const mapApplyError = (status: number, rawMessage: string) => {
    const message = String(rawMessage || "").toLowerCase();

    if (status === 400 && (message.includes("phone") || message.includes("invalid phone"))) {
      return {
        submitMessage: "Your phone number format is invalid. Please update your profile and try again.",
        profileMessage: "Phone number format is invalid in profile.",
        cvMessage: "",
      };
    }

    if (status === 403 || message.includes("verified")) {
      return {
        submitMessage: "Only verified candidates can apply. Please complete verification first.",
        profileMessage: "Account verification is required before applying.",
        cvMessage: "",
      };
    }

    if (status === 404 || message.includes("not found")) {
      return {
        submitMessage: "This job is no longer available.",
        profileMessage: "",
        cvMessage: "",
      };
    }

    if (status === 409 || message.includes("already applied")) {
      return {
        submitMessage: "You have already applied for this job.",
        profileMessage: "",
        cvMessage: "",
      };
    }

    if (status === 410 || message.includes("expired")) {
      return {
        submitMessage: "This job posting has expired and no longer accepts applications.",
        profileMessage: "",
        cvMessage: "",
      };
    }

    if (message.includes("pdf")) {
      return {
        submitMessage: "CV file must be in PDF format.",
        profileMessage: "",
        cvMessage: "CV file must be in PDF format.",
      };
    }

    if (message.includes("file") || message.includes("upload")) {
      return {
        submitMessage: "Unable to upload your CV file. Please try again.",
        profileMessage: "",
        cvMessage: "Unable to upload your CV file. Please try again.",
      };
    }

    return {
      submitMessage: "Unable to submit application. Please try again.",
      profileMessage: "",
      cvMessage: "",
    };
  };

  // Check if already applied or if company is viewing
  useEffect(() => {
    // Skip fetch if server already detected company viewer
    if (isCompanyViewer) {
      return;
    }
    
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/check-applied/${jobId}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success" && data.applied) {
          setAlreadyApplied(true);
          setApplicationId(data.applicationId);
          setApplicationStatus(data.applicationStatus);
          setIsGuest(false);
        } else if (data.code === "success") {
          setIsGuest(false); // Logged in candidate but not applied
          setIsVerified(data.isVerified || false);
        }
        if (data.code === "company") {
          setIsCompanyViewing(true);
          setIsGuest(false);
        }
        if (data.code === "company_other") {
          setIsOtherCompanyViewing(true);
          setIsGuest(false);
        }
        if (data.code === "guest" || data.code === "error") {
          setIsGuest(true); // Not logged in
        }
        setLoading(false);
      })
      .catch(() => {
        setIsGuest(false); // Don't show "Login Required" on network error
        setLoading(false);
      });
  }, [jobId, isCompanyViewer]);
  
  const submitApplication = async (params: {
    fullName: string;
    phone: string;
    file: File;
  }) => {
    const { fullName, phone, file } = params;
    if (submitting) return;
    setSubmitting(true);
    setSubmitError("");
    setProfileError("");
    setCvError("");

    const formData = new FormData();
    formData.append("jobId", jobId);
    formData.append("fullName", fullName);
    formData.append("phone", phone);
    formData.append("fileCV", file);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/apply`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      const data = await res.json();

      if (data.code === "success") {
        toast.success(data.message || "Application submitted successfully.");
        setAlreadyApplied(true);
        setCvFile([]);
        setCvError("");
        setProfileError("");
        return;
      }

      const mapped = mapApplyError(res.status, data.message || "");
      setSubmitError(mapped.submitMessage);
      if (mapped.profileMessage) setProfileError(mapped.profileMessage);
      if (mapped.cvMessage) setCvError(mapped.cvMessage);
      toast.error(mapped.submitMessage);
    } catch {
      const message = "Unable to submit application. Please try again.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (alreadyApplied || loading || isCompanyViewing || isOtherCompanyViewing || isGuest || !isVerified || submitting) return;

    const fullName = infoCandidate?.fullName || "";
    const phone = infoCandidate?.phone || "";

    if (!fullName) {
      toast.error("Please update your full name in profile before applying.");
      setSubmitError("Your profile is missing full name.");
      setProfileError("Full name is missing in profile.");
      return;
    }
    if (!phone) {
      toast.error("Please update your phone number in profile before applying.");
      setSubmitError("Your profile is missing phone number.");
      setProfileError("Phone number is missing in profile.");
      return;
    }
    setProfileError("");

    // Validate CV file
    if (cvFile.length === 0) {
      setCvError("Please select a CV file!");
      setSubmitError("Please select a CV file to continue.");
      return;
    }

    const file = cvFile[0].file;
    if (file.type !== 'application/pdf') {
      setCvError("File must be in PDF format!");
      setSubmitError("CV file must be in PDF format.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setCvError("File size must not exceed 5MB!");
      setSubmitError("CV file must not exceed 5MB.");
      return;
    }

    setCvError("");
    setSubmitError("");
    submitApplication({
      fullName,
      phone,
      file,
    });
  };

  if (loading) {
    return <ApplyFormSkeleton />;
  }

  // Company viewing their own job
  if (isCompanyViewing) {
    return (
      <div className="text-center py-[30px] border border-[#0088FF] rounded-[8px] bg-[#e6f4ff]">
        <FaCircleCheck className="text-[48px] text-[#0088FF] mx-auto mb-[16px]" />
        <h3 className="font-[700] text-[18px] text-[#004085] mb-[8px]">
          This is your job posting
        </h3>
        <p className="text-[#004085] text-[14px]">
          You can manage applications in &quot;Manage Applications&quot; section.
        </p>
      </div>
    );
  }

  // Company viewing another company's job
  if (isOtherCompanyViewing) {
    return (
      <div className="text-center py-[30px] border border-[#666] rounded-[8px] bg-[#f5f5f5]">
        <h3 className="font-[700] text-[18px] text-[#333] mb-[8px]">
          Company accounts cannot apply
        </h3>
        <p className="text-[#666] text-[14px]">
          This form is for candidates only.
        </p>
      </div>
    );
  }

  // Guest - not logged in
  if (isGuest) {
    return (
      <div className="text-center py-[30px] border border-[#FFB200] rounded-[8px] bg-[#fff9e6]">
        <h3 className="font-[700] text-[18px] text-[#856404] mb-[8px]">
          Login Required
        </h3>
        <p className="text-[#856404] text-[14px] mb-[16px]">
          Please login as a candidate to apply for this job.
        </p>
        <Link
          href={`/candidate/login?redirect=${encodeURIComponent(typeof window !== "undefined" ? window.location.pathname : "")}`}
          className="inline-block bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[24px] py-[12px] rounded-[8px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          Login to Apply
        </Link>
        <p className="text-[#856404] text-[12px] mt-[12px]">
          Don&apos;t have an account? <Link href="/candidate/register" className="text-[#0088FF] hover:underline">Register here</Link>
        </p>
      </div>
    );
  }

  // Show already applied message with status (check this BEFORE verification)
  if (alreadyApplied) {
    // Status-specific styling
    const statusConfig: Record<string, { border: string; bg: string; icon: string; title: string; message: string; btnBg: string; btnHover: string }> = {
      pending: {
        border: "border-[#FFB200]",
        bg: "bg-[#fff9e6]",
        icon: "text-[#FFB200]",
        title: "Application Submitted",
        message: "Your application is pending review by the company.",
        btnBg: "bg-[#FFB200]",
        btnHover: "hover:bg-[#e6a000]"
      },
      viewed: {
        border: "border-[#0088FF]",
        bg: "bg-[#e6f4ff]",
        icon: "text-[#0088FF]",
        title: "Application Viewed",
        message: "The company has viewed your application.",
        btnBg: "bg-[#0088FF]",
        btnHover: "hover:bg-[#0070d6]"
      },
      approved: {
        border: "border-[#28a745]",
        bg: "bg-[#d4edda]",
        icon: "text-[#28a745]",
        title: "Application Approved!",
        message: "Congratulations! You have been approved for this position.",
        btnBg: "bg-[#28a745]",
        btnHover: "hover:bg-[#218838]"
      },
      rejected: {
        border: "border-[#dc3545]",
        bg: "bg-[#f8d7da]",
        icon: "text-[#dc3545]",
        title: "Application Not Selected",
        message: "Unfortunately, your application was not selected for this position.",
        btnBg: "bg-[#6c757d]",
        btnHover: "hover:bg-[#5a6268]"
      }
    };

    const config = statusConfig[applicationStatus || "pending"] || statusConfig.pending;

    return (
      <div className={`text-center py-[30px] border ${config.border} rounded-[8px] ${config.bg}`}>
        <FaCircleCheck className={`text-[48px] ${config.icon} mx-auto mb-[16px]`} />
        <h3 className="font-[700] text-[18px] text-[#121212] mb-[8px]">
          {config.title}
        </h3>
        <p className="text-[#666] text-[14px] mb-[16px]">
          {config.message}
        </p>
        {applicationId && (
          <Link
            href={`/candidate-manage/cv/view/${applicationId}`}
            className={`inline-block ${config.btnBg} text-white px-[20px] py-[10px] rounded-[8px] ${config.btnHover} transition-colors duration-200`}
          >
            View Your Application
          </Link>
        )}
      </div>
    );
  }

  // Not verified - show verification required message
  if (!isVerified) {
    return (
      <div className="text-center py-[30px] border border-[#FF6B6B] rounded-[8px] bg-[#fff0f0]">
        <h3 className="font-[700] text-[18px] text-[#c92a2a] mb-[8px]">
          Verification Required
        </h3>
        <p className="text-[#c92a2a] text-[14px] mb-[16px]">
          Only verified UIT students and alumni can apply for jobs.<br />
          Please complete your profile (Full Name, Student ID, Cohort, Major) to get verified.
        </p>
        <Link
          href="/candidate-manage/profile"
          className="inline-block bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[24px] py-[12px] rounded-[8px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          Go to Profile
        </Link>
      </div>
    );
  }

  const candidateFullName = infoCandidate?.fullName || "";
  const candidatePhone = infoCandidate?.phone || "";

  if (!authLoading && isVerified && (!candidateFullName || !candidatePhone)) {
    const missingFullName = !candidateFullName;
    const missingPhone = !candidatePhone;
    const message = missingFullName && missingPhone
      ? "Please update your full name and phone number in your profile before applying."
      : missingFullName
        ? "Please update your full name in your profile before applying."
        : "Please update your phone number in your profile before applying.";
    const hint = missingPhone ? "Update phone in profile to proceed." : "Update full name in profile to proceed.";
    return (
      <div className="text-center py-[30px] border border-[#FFB200] rounded-[8px] bg-[#fff9e6]">
        <h3 className="font-[700] text-[18px] text-[#856404] mb-[8px]">
          Profile Information Required
        </h3>
        <p className="text-[#856404] text-[14px] mb-[16px]">
          {message}
        </p>
        <p className="text-[#8a6d3b] text-[12px] mb-[12px]">Hint: {hint}</p>
        <Link
          href="/candidate-manage/profile"
          className="inline-block bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[24px] py-[12px] rounded-[8px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
        >
          Go to Profile
        </Link>
      </div>
    );
  }

  return (
    <>
      <form 
        className="grid grid-cols-1 gap-[15px]"
        id="applyForm"
        onSubmit={handleSubmit}
      >
        <div className="">
          <p className="font-[500] text-[14px] text-black mb-[5px] flex items-center gap-[8px]">
            <FaFilePdf className="text-[#FF0000]" />
            CV File (PDF, max 5MB) *
          </p>
          <div className="cv-upload">
            <FilePond
              files={cvFile}
              onupdatefiles={(files) => {
                setCvFile(files);
                if (files.length > 0) {
                  setCvError("");
                  setSubmitError("");
                }
              }}
              allowMultiple={false}
              maxFiles={1}
              acceptedFileTypes={['application/pdf']}
              maxFileSize="5MB"
              labelIdle='<span class="filepond--label-action">Browse</span> or drag & drop your CV here'
              labelFileTypeNotAllowed="Only PDF files are allowed"
              fileValidateTypeLabelExpectedTypes="Accepts: PDF"
              credits={false}
            />
          </div>
          {cvError && (
            <p className="text-[#FF0000] text-[12px] mt-[5px]">{cvError}</p>
          )}
        </div>
        <div className="">
          {profileError && (
            <div className="mb-[10px] rounded-[8px] border border-[#FDE68A] bg-[#FFFBEB] px-[12px] py-[10px] text-[13px] text-[#92400E]">
              {profileError}
            </div>
          )}
          {submitError && (
            <div className="mb-[10px] rounded-[8px] border border-[#FECACA] bg-[#FEF2F2] px-[12px] py-[10px] text-[13px] text-[#B91C1C]">
              {submitError}
            </div>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {submitting ? "Submitting..." : "Submit Application"}
          </button>
          {submitError && !submitting && cvFile.length > 0 && (
            <button
              type="button"
              onClick={() => {
                const fullName = infoCandidate?.fullName || "";
                const phone = infoCandidate?.phone || "";
                const file = cvFile[0]?.file;
                if (!fullName || !phone || !file) return;
                submitApplication({ fullName, phone, file });
              }}
              className="mt-[10px] w-full h-[44px] rounded-[8px] border border-[#D7E3F7] bg-white font-[600] text-[14px] text-[#0B60D1] hover:border-[#0B60D1]"
            >
              Retry Submit
            </button>
          )}
        </div>
      </form>
      <style jsx global>{`
        .cv-upload .filepond--root {
          margin-bottom: 0;
        }
        .cv-upload .filepond--panel-root {
          border: 2px dashed #DEDEDE;
          border-radius: 8px;
          background-color: #F9F9F9;
        }
        .cv-upload .filepond--drop-label {
          color: #666;
          font-size: 14px;
        }
        .cv-upload .filepond--label-action {
          color: #0088FF;
          font-weight: 600;
          text-decoration: underline;
        }
        .cv-upload .filepond--item-panel {
          background-color: #E8F4FD;
        }
        .cv-upload .filepond--file-info-main {
          font-size: 12px;
        }
      `}</style>
    </>
  )
}
