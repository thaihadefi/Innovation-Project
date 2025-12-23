"use client"

interface PaginationProps {
  currentPage: number;
  totalPage: number;
  totalRecord: number;
  skip: number;
  currentCount: number;
  onPageChange: (page: number) => void;
}

export const Pagination = ({
  currentPage,
  totalPage,
  totalRecord,
  skip,
  currentCount,
  onPageChange
}: PaginationProps) => {
  if (totalPage <= 1) return null;

  return (
    <div className="mt-[30px] flex flex-wrap items-center gap-[16px]">
      <span className="text-[14px] text-[#666]">
        Show {skip + 1} - {skip + currentCount} of {totalRecord}
      </span>
      <select
        value={currentPage}
        onChange={(e) => onPageChange(parseInt(e.target.value))}
        className="rounded-[8px] bg-white border border-[#DEDEDE] py-[12px] px-[18px] font-[400] text-[16px] text-[#414042] cursor-pointer hover:border-[#0088FF] outline-none"
      >
        {Array.from({ length: totalPage }, (_, i) => i + 1).map(page => (
          <option key={page} value={page}>
            Page {page}
          </option>
        ))}
      </select>
    </div>
  );
};
