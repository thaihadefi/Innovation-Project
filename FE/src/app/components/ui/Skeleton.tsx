"use client";

/**
 * Skeleton loading component - shimmer effect for loading states
 * Best practice: show skeleton while data is loading instead of 0 or empty
 */
export const Skeleton = ({ 
  className = "", 
  width = "100%", 
  height = "20px" 
}: { 
  className?: string; 
  width?: string | number; 
  height?: string | number;
}) => {
  return (
    <div 
      className={`animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded ${className}`}
      style={{ 
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite'
      }}
    />
  );
};

/**
 * Text skeleton - inline skeleton for text content
 */
export const TextSkeleton = ({ width = "60px" }: { width?: string | number }) => (
  <span 
    className="inline-block animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 rounded"
    style={{ 
      width: typeof width === 'number' ? `${width}px` : width,
      height: '1em',
      verticalAlign: 'middle'
    }}
  />
);

/**
 * Number skeleton - for displaying loading numbers (counts, stats, etc.)
 */
export const NumberSkeleton = ({ className = "" }: { className?: string }) => (
  <span 
    className={`inline-block animate-pulse bg-white/30 rounded ${className}`}
    style={{ 
      width: '2em',
      height: '1em',
      verticalAlign: 'middle'
    }}
  />
);

/**
 * Notification item skeleton for dropdown loading
 */
export const NotificationItemSkeleton = () => (
  <div className="p-[12px] border-b border-[#f0f0f0] animate-pulse">
    <div className="flex items-start gap-[8px]">
      <div className="flex-1">
        <div className="h-[14px] bg-gray-200 rounded w-[70%] mb-[8px]" />
        <div className="h-[12px] bg-gray-200 rounded w-[90%] mb-[6px]" />
        <div className="h-[10px] bg-gray-200 rounded w-[40px]" />
      </div>
      <div className="w-[8px] h-[8px] bg-gray-200 rounded-full flex-shrink-0 mt-[4px]" />
    </div>
  </div>
);

/**
 * CV Detail page skeleton
 */
export const CVDetailSkeleton = () => (
  <div className="animate-pulse">
    {/* Header */}
    <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
      <div className="flex items-center gap-[16px]">
        <div className="h-[20px] bg-gray-200 rounded w-[60px]" />
        <div>
          <div className="h-[24px] bg-gray-200 rounded w-[150px] mb-[8px]" />
          <div className="h-[14px] bg-gray-200 rounded w-[200px]" />
        </div>
      </div>
      <div className="flex gap-[10px]">
        <div className="h-[40px] bg-gray-200 rounded w-[130px]" />
        <div className="h-[40px] bg-gray-200 rounded w-[120px]" />
      </div>
    </div>
    
    {/* Status banner */}
    <div className="text-center py-[24px] px-[20px] rounded-[8px] mb-[20px] border-2 border-gray-200 bg-gray-50">
      <div className="w-[48px] h-[48px] bg-gray-200 rounded-full mx-auto mb-[12px]" />
      <div className="h-[18px] bg-gray-200 rounded w-[250px] mx-auto mb-[8px]" />
      <div className="h-[14px] bg-gray-200 rounded w-[400px] max-w-full mx-auto" />
    </div>
    
    {/* Info grid */}
    <div className="grid md:grid-cols-3 gap-[16px] mb-[20px] p-[16px] bg-[#f9f9f9] rounded-[8px] border border-[#DEDEDE]">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <div className="h-[12px] bg-gray-200 rounded w-[60px] mb-[8px]" />
          <div className="h-[16px] bg-gray-200 rounded w-[120px]" />
        </div>
      ))}
    </div>
    
    {/* PDF area */}
    <div className="border border-[#DEDEDE] rounded-[8px] overflow-hidden bg-white">
      <div className="bg-gray-200 h-[36px]" />
      <div className="h-[400px] bg-gray-100" />
    </div>
  </div>
);

/**
 * Form field skeleton
 */
export const FormFieldSkeleton = ({ withLabel = true }: { withLabel?: boolean }) => (
  <div className="animate-pulse">
    {withLabel && <div className="h-[14px] bg-gray-200 rounded w-[80px] mb-[8px]" />}
    <div className="h-[46px] bg-gray-200 rounded-[8px]" />
  </div>
);

/**
 * Apply form skeleton for job detail page
 */
export const ApplyFormSkeleton = () => (
  <div className="grid grid-cols-1 gap-[15px] animate-pulse">
    <FormFieldSkeleton />
    <FormFieldSkeleton />
    <div>
      <div className="h-[14px] bg-gray-200 rounded w-[150px] mb-[8px]" />
      <div className="h-[100px] bg-gray-200 rounded-[8px] border-2 border-dashed border-gray-300" />
    </div>
    <div className="h-[48px] bg-gray-200 rounded-[8px]" />
  </div>
);

/**
 * Full page loading skeleton for layout auth checks
 */
export const PageLoadingSkeleton = () => (
  <div className="min-h-[400px] flex items-center justify-center">
    <div className="flex flex-col items-center gap-[16px] animate-pulse">
      <div className="w-[40px] h-[40px] border-4 border-gray-200 border-t-[#0088FF] rounded-full animate-spin" />
      <div className="h-[14px] bg-gray-200 rounded w-[80px]" />
    </div>
  </div>
);
