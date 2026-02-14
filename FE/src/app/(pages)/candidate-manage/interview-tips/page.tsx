import Link from "next/link";
import { FaBookOpen, FaLayerGroup } from "react-icons/fa6";
import { interviewTipsSections } from "./interviewTipsConfig";
import InterviewTipsRootPagination from "./InterviewTipsRootPagination";
import { paginationConfig } from "@/configs/variable";

type InterviewTipsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function InterviewTipsPage({ searchParams }: InterviewTipsPageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(String(params.page || "1"), 10) || 1);
  const pageSize = paginationConfig.interviewTipsRoot || 8;
  const totalRecord = interviewTipsSections.length;
  const totalPage = Math.max(1, Math.ceil(totalRecord / pageSize));
  const safePage = Math.min(page, totalPage);
  const skip = (safePage - 1) * pageSize;
  const paginatedSections = interviewTipsSections.slice(skip, skip + pageSize);

  return (
    <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-[16px] sm:p-[24px] shadow-sm">
      <div className="inline-flex items-center gap-[10px] rounded-full bg-white/80 px-[14px] py-[6px] text-[12px] font-[600] text-[#0A3A7A] shadow-sm">
        <FaBookOpen /> Interview Prep Library
      </div>
      <h1 className="mt-[14px] text-[34px] font-[700] text-[#111827] leading-tight">
        Interview Tips
      </h1>
      <p className="mt-[8px] max-w-[720px] md:max-w-[860px] text-[16px] text-[#4B5563] text-balance">
        A structured library of interview guidance. Choose a track below to dive into curated
        resources and templates.
      </p>

      <div className="mt-[20px] grid gap-[16px] md:grid-cols-2">
        {paginatedSections.map((section) => (
          <Link
            key={section.key}
            href={section.href}
            className="rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] p-[18px] transition-all duration-200 hover:bg-white hover:shadow-md cursor-pointer"
          >
            <div className="flex items-center gap-[10px] text-[#0EA5E9]">
              <span className="flex h-[36px] w-[36px] items-center justify-center rounded-[10px] bg-white">
                <FaLayerGroup />
              </span>
              <span className="text-[16px] font-[700] text-[#111827]">{section.title}</span>
            </div>
            <p className="mt-[8px] text-[14px] text-[#6B7280]">{section.description}</p>
          </Link>
        ))}
      </div>
      {totalPage > 1 && (
        <InterviewTipsRootPagination
          currentPage={safePage}
          totalPage={totalPage}
          totalRecord={totalRecord}
          pageSize={pageSize}
          currentCount={paginatedSections.length}
        />
      )}
    </section>
  );
}
