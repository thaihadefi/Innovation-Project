"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Pagination } from "@/app/components/pagination/Pagination";

type InterviewPrepRootPaginationProps = {
  currentPage: number;
  totalPage: number;
  totalRecord: number;
  pageSize: number;
  currentCount: number;
};

export default function InterviewPrepRootPagination({
  currentPage,
  totalPage,
  totalRecord,
  pageSize,
  currentCount
}: InterviewPrepRootPaginationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <Pagination
      currentPage={currentPage}
      totalPage={totalPage}
      totalRecord={totalRecord}
      skip={(currentPage - 1) * pageSize}
      currentCount={currentCount}
      onPageChange={(page) => {
        const params = new URLSearchParams(searchParams.toString());
        if (page <= 1) {
          params.delete("page");
        } else {
          params.set("page", String(page));
        }
        const query = params.toString();
        router.push(`${pathname}${query ? `?${query}` : ""}`);
      }}
    />
  );
}
