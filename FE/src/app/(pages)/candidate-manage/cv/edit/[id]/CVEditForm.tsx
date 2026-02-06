"use client"
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { FaArrowLeft, FaFilePdf } from 'react-icons/fa6';
import Link from "next/link";
import { FormFieldSkeleton } from "@/app/components/ui/Skeleton";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

export const CVEditForm = ({ cvId, initialCVDetail }: { cvId: string; initialCVDetail: any }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [cvDetail, setCvDetail] = useState<any>(initialCVDetail);
  const [cvFile, setCvFile] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    // Skip if we already have data from server or already fetched
    if (hasFetchedRef.current || initialCVDetail) {
      // Check if CV has been reviewed or job expired - cannot edit
      if (initialCVDetail && initialCVDetail.status !== "initial") {
        toast.error("Cannot edit application after it has been reviewed.");
        router.push(`/candidate-manage/cv/view/${cvId}`);
      }
      if (initialCVDetail && initialCVDetail.isExpired) {
        toast.error("Cannot edit application after the job has expired.");
        router.push(`/candidate-manage/cv/view/${cvId}`);
      }
      return;
    }
    hasFetchedRef.current = true;

    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/detail/${cvId}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          // Redirect if CV has been reviewed or job expired - cannot edit
          if (data.cvDetail.status !== "initial") {
            toast.error("Cannot edit application after it has been reviewed.");
            router.push(`/candidate-manage/cv/view/${cvId}`);
            return;
          }
          if (data.cvDetail.isExpired) {
            toast.error("Cannot edit application after the job has expired.");
            router.push(`/candidate-manage/cv/view/${cvId}`);
            return;
          }
          setCvDetail(data.cvDetail);
        } else {
          toast.error(data.message);
          router.push("/candidate-manage/cv/list");
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed to load application details");
        setLoading(false);
      });
  }, [cvId, router, initialCVDetail]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    if (cvFile.length > 0) {
      formData.append("fileCV", cvFile[0].file);
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/edit/${cvId}`, {
      method: "PATCH",
      body: formData,
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          toast.success(data.message);
          router.push("/candidate-manage/cv/list");
        } else {
          toast.error(data.message);
        }
        setSubmitting(false);
      })
      .catch(() => {
        toast.error("Failed to update application");
        setSubmitting(false);
      });
  };

  if (loading) {
    return (
      <div className="max-w-[600px] mx-auto animate-pulse">
        <div className="mb-[20px]">
          <div className="h-[20px] bg-gray-200 rounded w-[140px]" />
        </div>
        <div className="border border-[#DEDEDE] rounded-[8px] p-[24px] bg-white">
          <div className="h-[24px] bg-gray-200 rounded w-[150px] mb-[8px]" />
          <div className="h-[14px] bg-gray-200 rounded w-[200px] mb-[20px]" />
          <div className="grid grid-cols-1 gap-[15px]">
            <FormFieldSkeleton />
            <FormFieldSkeleton />
            <div>
              <div className="h-[14px] bg-gray-200 rounded w-[200px] mb-[8px]" />
              <div className="h-[80px] bg-gray-200 rounded-[8px] border-2 border-dashed border-gray-300" />
            </div>
            <div className="flex gap-[10px]">
              <div className="flex-1 h-[48px] bg-gray-200 rounded-[8px]" />
              <div className="flex-1 h-[48px] bg-gray-200 rounded-[8px]" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!cvDetail) {
    return null;
  }

  return (
    <div className="max-w-[600px] mx-auto">
      <div className="mb-[20px]">
        <Link
          href="/candidate-manage/cv/list"
          className="inline-flex items-center gap-[8px] text-[#0088FF] hover:underline"
        >
          <FaArrowLeft /> Back to Applications
        </Link>
      </div>

      <div className="border border-[#DEDEDE] rounded-[8px] p-[24px] bg-white">
        <h2 className="font-[700] text-[20px] text-black mb-[20px]">
          Edit Application
        </h2>
        <p className="text-[#666] text-[14px] mb-[16px]">
          Applied for: {cvDetail.jobSlug ? (
            <Link href={`/job/detail/${cvDetail.jobSlug}`} className="font-[600] text-[#0088FF] hover:underline">
              {cvDetail.jobTitle}
            </Link>
          ) : (
            <span className="font-[600] text-[#0088FF]">{cvDetail.jobTitle}</span>
          )}
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-[15px]">
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

          <div className="">
            <label
              htmlFor="fileCV"
              className="font-[500] text-[14px] text-black mb-[5px] flex items-center gap-[8px]"
            >
              <FaFilePdf className="text-[#FF0000]" />
              CV File (PDF, max 5MB)
            </label>
            <div className="cv-upload">
              <FilePond
                files={cvFile}
                onupdatefiles={setCvFile}
                allowMultiple={false}
                maxFiles={1}
                acceptedFileTypes={["application/pdf"]}
                maxFileSize="5MB"
                labelIdle='<span class="filepond--label-action">Browse</span> or drag & drop your CV here'
                labelFileTypeNotAllowed="Only PDF files are allowed"
                fileValidateTypeLabelExpectedTypes="Accepts: PDF"
                credits={false}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={submitting}
              className="w-full h-[48px] rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] font-[700] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
          <div className="text-center text-[14px]">
            <Link
              href={`/candidate-manage/cv/view/${cvId}`}
              className="text-[#0088FF] hover:underline font-[600]"
            >
              View Current Application
            </Link>
          </div>
        </form>
      </div>

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
    </div>
  );
};
