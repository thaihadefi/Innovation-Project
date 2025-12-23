"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import JustValidate from "just-validate";
import { useEffect, useState, useRef } from "react";
import { toast } from 'sonner';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { FaFilePdf, FaCircleCheck } from 'react-icons/fa6';
import Link from "next/link";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

export const FormApply = (props: {
  jobId: string
}) => {
  const { jobId } = props;
  const [cvFile, setCvFile] = useState<any[]>([]);
  const [cvError, setCvError] = useState<string>("");
  const [alreadyApplied, setAlreadyApplied] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isGuest, setIsGuest] = useState(true); // Default true until we know
  const [isCompanyViewing, setIsCompanyViewing] = useState(false);
  const [isOtherCompanyViewing, setIsOtherCompanyViewing] = useState(false);
  const validatorRef = useRef<InstanceType<typeof JustValidate> | null>(null);

  // Check if already applied or if company is viewing
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/check-applied/${jobId}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success" && data.applied) {
          setAlreadyApplied(true);
          setApplicationId(data.applicationId);
          setIsGuest(false);
        } else if (data.code === "success") {
          setIsGuest(false); // Logged in candidate but not applied
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
        setLoading(false);
      });
  }, [jobId]);
  
  useEffect(() => {
    if (alreadyApplied || loading || isCompanyViewing || isOtherCompanyViewing || isGuest) return;

    const validator = new JustValidate("#applyForm");
    validatorRef.current = validator;

    validator
      .addField('#fullName', [
        {
          rule: 'required',
          errorMessage: 'Please enter full name!'
        },
        {
          rule: 'minLength',
          value: 5,
          errorMessage: 'Full name must be at least 5 characters!',
        },
        {
          rule: 'maxLength',
          value: 50,
          errorMessage: 'Full name must not exceed 50 characters!',
        },
      ])
      .addField('#phone', [
        {
          rule: 'required',
          errorMessage: 'Please enter phone number!'
        },
        {
          rule: 'customRegexp',
          value: /^(84|0[35789])[0-9]{8}$/,
          errorMessage: 'Invalid VN phone number! (e.g., 0912345678)'
        },
      ])
      .onSuccess((event: any) => {
        // Validate CV file
        if (cvFile.length === 0) {
          setCvError("Please select a CV file!");
          return;
        }

        const file = cvFile[0].file;
        if (file.type !== 'application/pdf') {
          setCvError("File must be in PDF format!");
          return;
        }

        if (file.size > 5 * 1024 * 1024) {
          setCvError("File size must not exceed 5MB!");
          return;
        }

        setCvError("");

        // Get form values using document.getElementById (event.target may be undefined)
        const fullNameEl = document.getElementById('fullName') as HTMLInputElement;
        const emailEl = document.getElementById('email') as HTMLInputElement;
        const phoneEl = document.getElementById('phone') as HTMLInputElement;
        
        const fullName = fullNameEl?.value || '';
        const email = emailEl?.value || '';
        const phone = phoneEl?.value || '';
        
        // Create FormData
        const formData = new FormData();
        formData.append("jobId", jobId);
        formData.append("fullName", fullName);
        formData.append("email", email);
        formData.append("phone", phone);
        formData.append("fileCV", file);
        
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/apply`, {
          method: "POST",
          body: formData,
          credentials: "include",
        })
          .then(res => res.json())
          .then(data => {
            if(data.code === "error") {
              toast.error(data.message);
            }
    
            if(data.code === "success") {
              toast.success(data.message);
              setAlreadyApplied(true);
              event.target.reset();
              setCvFile([]);
            }
          })
      })

    return () => {
      validator.destroy();
    };
  }, [jobId, cvFile, alreadyApplied, loading, isCompanyViewing, isOtherCompanyViewing, isGuest]);

  if (loading) {
    return (
      <div className="text-center py-[20px]">
        <p className="text-[#666]">Loading...</p>
      </div>
    );
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
          href="/candidate/login"
          className="inline-block bg-[#0088FF] text-white px-[24px] py-[12px] rounded-[4px] font-[600] hover:bg-[#0077DD]"
        >
          Login to Apply
        </Link>
        <p className="text-[#856404] text-[12px] mt-[12px]">
          Don&apos;t have an account? <Link href="/candidate/register" className="text-[#0088FF] hover:underline">Register here</Link>
        </p>
      </div>
    );
  }

  // Show already applied message
  if (alreadyApplied) {
    return (
      <div className="text-center py-[30px] border border-[#28a745] rounded-[8px] bg-[#d4edda]">
        <FaCircleCheck className="text-[48px] text-[#28a745] mx-auto mb-[16px]" />
        <h3 className="font-[700] text-[18px] text-[#155724] mb-[8px]">
          You have already applied for this job!
        </h3>
        <p className="text-[#155724] text-[14px] mb-[16px]">
          Please wait for the company to review your application.
        </p>
        {applicationId && (
          <Link
            href={`/candidate-manage/cv/view/${applicationId}`}
            className="inline-block bg-[#28a745] text-white px-[20px] py-[10px] rounded-[4px] hover:bg-[#218838]"
          >
            View Your Application
          </Link>
        )}
      </div>
    );
  }

  return (
    <>
      <form 
        className="grid grid-cols-1 gap-[15px]"
        id="applyForm"
      >
        <div className="">
          <label
            htmlFor="fullName"
            className="font-[500] text-[14px] text-black mb-[5px]"
          >
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            id="fullName"
            className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="">
          <label
            htmlFor="phone"
            className="font-[500] text-[14px] text-black mb-[5px]"
          >
            Phone Number *
          </label>
          <input
            type="text"
            name="phone"
            id="phone"
            className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black"
          />
        </div>
        <div className="">
          <label
            htmlFor="fileCV"
            className="font-[500] text-[14px] text-black mb-[5px] flex items-center gap-[8px]"
          >
            <FaFilePdf className="text-[#FF0000]" />
            CV File (PDF, max 5MB) *
          </label>
          <div className="cv-upload">
            <FilePond
              files={cvFile}
              onupdatefiles={setCvFile}
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
          <button className="w-full h-[48px] rounded-[4px] bg-[#0088FF] font-[700] text-[16px] text-white hover:bg-[#0077DD]">
            Submit Application
          </button>
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