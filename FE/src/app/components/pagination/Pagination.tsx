"use client"

interface PaginationProps {
  currentPage: number;
  totalPage: number;
  totalRecord?: number;
  skip?: number;
  currentCount?: number;
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

  // Generate page numbers to show (max 5 pages around current)
  const getPageNumbers = () => {
    const pages: number[] = [];
    const maxVisible = 5;
    
    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let end = Math.min(totalPage, start + maxVisible - 1);
    
    // Adjust start if we're near the end
    if (end - start + 1 < maxVisible) {
      start = Math.max(1, end - maxVisible + 1);
    }
    
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="mt-[24px]">
      {/* Optional record info */}
      {totalRecord !== undefined && skip !== undefined && currentCount !== undefined && (
        <div className="text-center text-[14px] text-[#666] mb-[12px]">
          Showing {skip + 1} - {skip + currentCount} of {totalRecord}
        </div>
      )}
      
      <div className="flex items-center justify-center gap-[4px]">
        {/* Previous button */}
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-[12px] py-[8px] rounded-[4px] border border-[#DEDEDE] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#0088FF] hover:text-[#0088FF] transition-colors"
        >
          Prev
        </button>

        {/* First page + ellipsis */}
        {pageNumbers[0] > 1 && (
          <>
            <button
              onClick={() => onPageChange(1)}
              className="min-w-[36px] h-[36px] rounded-[4px] border border-[#DEDEDE] text-[14px] hover:border-[#0088FF] hover:text-[#0088FF] transition-colors"
            >
              1
            </button>
            {pageNumbers[0] > 2 && (
              <span className="px-[8px] text-[#999]">...</span>
            )}
          </>
        )}

        {/* Page numbers */}
        {pageNumbers.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`min-w-[36px] h-[36px] rounded-[4px] border text-[14px] transition-colors ${
              page === currentPage
                ? "bg-[#0088FF] border-[#0088FF] text-white"
                : "border-[#DEDEDE] hover:border-[#0088FF] hover:text-[#0088FF]"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Last page + ellipsis */}
        {pageNumbers[pageNumbers.length - 1] < totalPage && (
          <>
            {pageNumbers[pageNumbers.length - 1] < totalPage - 1 && (
              <span className="px-[8px] text-[#999]">...</span>
            )}
            <button
              onClick={() => onPageChange(totalPage)}
              className="min-w-[36px] h-[36px] rounded-[4px] border border-[#DEDEDE] text-[14px] hover:border-[#0088FF] hover:text-[#0088FF] transition-colors"
            >
              {totalPage}
            </button>
          </>
        )}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPage}
          className="px-[12px] py-[8px] rounded-[4px] border border-[#DEDEDE] text-[14px] disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#0088FF] hover:text-[#0088FF] transition-colors"
        >
          Next
        </button>
      </div>
    </div>
  );
};
