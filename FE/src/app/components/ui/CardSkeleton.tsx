"use client";

/**
 * Card skeleton for loading job/company cards
 * Used as placeholder while data is fetching
 */
export const CardSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div 
      className={`rounded-[8px] border border-[#DEDEDE] bg-white animate-pulse ${className}`}
    >
      {/* Header/Image area */}
      <div className="h-[100px] bg-gray-200 rounded-t-[8px]" />
      
      {/* Logo placeholder */}
      <div className="w-[80px] h-[80px] mx-auto -mt-[40px] bg-gray-300 rounded-[8px] border-4 border-white" />
      
      {/* Title placeholder */}
      <div className="px-[16px] mt-[16px]">
        <div className="h-[20px] bg-gray-200 rounded w-[80%] mx-auto" />
      </div>
      
      {/* Footer placeholder */}
      <div className="mt-[16px] px-[16px] py-[12px] bg-[#F7F7F7] flex justify-between">
        <div className="h-[14px] bg-gray-200 rounded w-[60px]" />
        <div className="h-[14px] bg-gray-200 rounded w-[50px]" />
      </div>
    </div>
  );
};

/**
 * Job card skeleton for search results
 */
export const JobCardSkeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div 
      className={`rounded-[8px] border border-[#DEDEDE] bg-white p-[16px] animate-pulse ${className}`}
    >
      <div className="flex gap-[16px]">
        {/* Logo placeholder */}
        <div className="w-[80px] h-[80px] bg-gray-200 rounded-[8px] flex-shrink-0" />
        
        {/* Content */}
        <div className="flex-1">
          {/* Title */}
          <div className="h-[18px] bg-gray-200 rounded w-[70%] mb-[8px]" />
          {/* Company */}
          <div className="h-[14px] bg-gray-200 rounded w-[50%] mb-[8px]" />
          {/* Tags */}
          <div className="flex gap-[8px]">
            <div className="h-[24px] bg-gray-200 rounded w-[60px]" />
            <div className="h-[24px] bg-gray-200 rounded w-[80px]" />
            <div className="h-[24px] bg-gray-200 rounded w-[50px]" />
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Grid of card skeletons
 */
export const CardSkeletonGrid = ({ 
  count = 6, 
  type = "company",
  className = ""
}: { 
  count?: number; 
  type?: "company" | "job";
  className?: string;
}) => {
  const SkeletonComponent = type === "job" ? JobCardSkeleton : CardSkeleton;
  
  return (
    <div className={`grid lg:grid-cols-3 grid-cols-2 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px] ${className}`}>
      {Array(count).fill(null).map((_, index) => (
        <SkeletonComponent key={`skeleton-${index}`} />
      ))}
    </div>
  );
};
