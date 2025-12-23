"use client"
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from 'sonner';
import { FilePond, registerPlugin } from 'react-filepond';
import 'filepond/dist/filepond.min.css';
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type';
import FilePondPluginFileValidateSize from 'filepond-plugin-file-validate-size';
import { FaArrowLeft } from 'react-icons/fa6';
import Link from "next/link";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginFileValidateSize
);

export const CVEditForm = ({ cvId }: { cvId: string }) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [cvDetail, setCvDetail] = useState<any>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [cvFile, setCvFile] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/detail/${cvId}`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setCvDetail(data.cvDetail);
          setFullName(data.cvDetail.fullName || "");
          setPhone(data.cvDetail.phone || "");
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
  }, [cvId, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData();
    formData.append("fullName", fullName);
    formData.append("phone", phone);
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
      <div className="text-center py-[40px]">
        <p className="text-[#666]">Loading...</p>
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
        <h2 className="font-[700] text-[20px] text-[#121212] mb-[8px]">
          Edit Application
        </h2>
        <p className="text-[#666] text-[14px] mb-[20px]">
          Applied for: <span className="font-[600] text-[#0088FF]">{cvDetail.jobTitle}</span>
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-[15px]">
          <div>
            <label className="font-[500] text-[14px] text-black mb-[5px] block">
              Full Name *
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black"
            />
          </div>

          <div>
            <label className="font-[500] text-[14px] text-black mb-[5px] block">
              Phone Number *
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="w-full h-[46px] rounded-[4px] border border-[#DEDEDE] px-[20px] font-[500] text-[14px] text-black"
            />
          </div>

          <div>
            <label className="font-[500] text-[14px] text-black mb-[5px] block">
              CV File (PDF, max 5MB) 
              <span className="text-[#666] font-normal ml-[8px]">
                Upload new file to replace current CV
              </span>
            </label>
            <div className="cv-upload">
              <FilePond
                files={cvFile}
                onupdatefiles={setCvFile}
                allowMultiple={false}
                maxFiles={1}
                acceptedFileTypes={['application/pdf']}
                maxFileSize="5MB"
                labelIdle='<span class="filepond--label-action">Browse</span> or drag CV file here'
                credits={false}
              />
            </div>
          </div>

          <div className="flex gap-[10px]">
            <Link
              href={`/candidate-manage/cv/view/${cvId}`}
              className="flex-1 h-[48px] rounded-[4px] bg-[#28a745] font-[700] text-[16px] text-white hover:bg-[#218838] flex items-center justify-center"
            >
              View Current Application
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-[48px] rounded-[4px] bg-[#0088FF] font-[700] text-[16px] text-white hover:bg-[#0077DD] disabled:opacity-50"
            >
              {submitting ? "Saving..." : "Save Changes"}
            </button>
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
      `}</style>
    </div>
  );
};
