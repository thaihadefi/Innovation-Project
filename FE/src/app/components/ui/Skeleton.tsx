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
export const FormFieldSkeleton = ({ withLabel = true, height = "46px" }: { withLabel?: boolean, height?: string | number }) => (
  <div className="animate-pulse">
    {withLabel && <div className="h-[14px] bg-gray-200 rounded w-[80px] mb-[8px]" />}
    <div className={`bg-gray-200 rounded-[8px]`} style={{ height: typeof height === 'number' ? `${height}px` : height }} />
  </div>
);

/**
 * Generic Grid Skeleton for forms
 */
export const FormGridSkeleton = ({ rows = 4, cols = 2 }: { rows?: number, cols?: number }) => (
  <div className={`grid gap-x-[20px] gap-y-[15px] ${cols === 2 ? 'sm:grid-cols-2 grid-cols-1' : 'grid-cols-1'}`}>
    {Array.from({ length: rows * cols }).map((_, i) => (
      <FormFieldSkeleton key={i} />
    ))}
  </div>
);

/**
 * Specialized Skeleton for Candidate Profile
 */
export const CandidateProfileSkeleton = () => (
  <div className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px] animate-pulse">
    <div className="sm:col-span-2"><FormFieldSkeleton height={46} /></div> {/* Full Name */}
    <div className="sm:col-span-2"><FormFieldSkeleton height={46} /></div> {/* Student ID */}
    <FormFieldSkeleton height={46} /> {/* Cohort */}
    <FormFieldSkeleton height={46} /> {/* Major */}
    <div className="sm:col-span-2"><FormFieldSkeleton height={46} /></div> {/* Skills */}
    <div className="sm:col-span-2"><FormFieldSkeleton height={100} /></div> {/* Avatar upload */}
    <FormFieldSkeleton height={46} /> {/* Email */}
    <FormFieldSkeleton height={46} /> {/* Phone */}
    <div className="sm:col-span-2 mt-[10px]"><div className="h-[48px] bg-gray-200 rounded-[8px] w-full" /></div>
  </div>
);

/**
 * Specialized Skeleton for Company Profile
 */
export const CompanyProfileSkeleton = () => (
  <div className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px] animate-pulse">
    <div className="sm:col-span-1"><FormFieldSkeleton height={46} /></div> {/* Company Name */}
    <div className="sm:col-span-1"><FormFieldSkeleton height={46} /></div> {/* Location */}
    <div className="sm:col-span-2"><FormFieldSkeleton height={46} /></div> {/* Address */}
    <FormFieldSkeleton height={46} /> {/* Model */}
    <FormFieldSkeleton height={46} /> {/* Size */}
    <FormFieldSkeleton height={46} /> {/* Working Time */}
    <FormFieldSkeleton height={46} /> {/* OT policy */}
    <div className="sm:col-span-2"><FormFieldSkeleton height={150} /></div> {/* Description Editor */}
    <div className="sm:col-span-2 mt-[10px]"><div className="h-[48px] bg-gray-200 rounded-[8px] w-full" /></div>
  </div>
);

/**
 * Specialized Skeleton for Job Edit
 */
export const JobEditSkeleton = () => (
  <div className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px] animate-pulse">
    <div className="sm:col-span-2"><FormFieldSkeleton height={46} /></div> {/* Title */}
    <FormFieldSkeleton height={46} /> {/* Position */}
    <FormFieldSkeleton height={46} /> {/* Form */}
    <FormFieldSkeleton height={46} /> {/* Sal Min */}
    <FormFieldSkeleton height={46} /> {/* Sal Max */}
    <div className="sm:col-span-2"><FormFieldSkeleton height={150} /></div> {/* Description Editor */}
    <div className="sm:col-span-2 mt-[10px]"><div className="h-[48px] bg-gray-200 rounded-[8px] w-full" /></div>
  </div>
);

/**
 * Specialized Skeleton for CV Edit
 */
export const CVEditSkeleton = () => (
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

/**
 * Specialized Skeleton for Admin Profile
 */
export const AdminProfileSkeleton = () => (
  <div className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px] animate-pulse">
    <div className="sm:col-span-2"><FormFieldSkeleton height={46} /></div>
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <div className="sm:col-span-2 mt-[10px]"><div className="h-[48px] bg-gray-200 rounded-[8px] w-full" /></div>
  </div>
);

/**
 * Specialized Skeleton for Job Create
 */
export const JobCreateSkeleton = () => (
  <div className="grid sm:grid-cols-2 grid-cols-1 gap-x-[20px] gap-y-[15px] animate-pulse">
    <div className="sm:col-span-2"><FormFieldSkeleton height={46} /></div>
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <FormFieldSkeleton height={46} />
    <div className="sm:col-span-2"><FormFieldSkeleton height={150} /></div>
    <div className="sm:col-span-2"><FormFieldSkeleton height={100} /></div>
    <div className="sm:col-span-2"><FormFieldSkeleton height={150} /></div>
    <div className="sm:col-span-2 mt-[10px]"><div className="h-[48px] bg-gray-200 rounded-[8px] w-full" /></div>
  </div>
);

/**
 * Specialized Skeleton for Review Form (Modal)
 */
export const ReviewFormSkeleton = () => (
  <div className="bg-white rounded-[12px] w-full max-w-[700px] mx-[20px] animate-pulse">
    <div className="px-[24px] py-[16px] border-b border-[#DEDEDE] flex justify-between">
      <div className="h-[20px] bg-gray-200 rounded w-[150px]" />
      <div className="w-[20px] h-[20px] bg-gray-200 rounded-full" />
    </div>
    <div className="p-[24px] space-y-[20px]">
      <div className="h-[14px] bg-gray-200 rounded w-[40%]" />
      <div className="flex gap-[8px]"><div className="w-[32px] h-[32px] bg-gray-200 rounded-full" /></div>
      <div className="h-[150px] bg-gray-100 rounded-[8px]" />
      <div className="h-[46px] bg-gray-200 rounded-[10px]" />
      <div className="h-[150px] bg-gray-200 rounded-[10px]" />
      <div className="flex gap-[12px]">
        <div className="flex-1 h-[48px] bg-gray-200 rounded-[8px]" />
        <div className="flex-1 h-[48px] bg-gray-200 rounded-[8px]" />
      </div>
    </div>
  </div>
);

/**
 * Generic Auth Form Skeleton (Login, Register, etc.)
 */
export const AuthFormSkeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="space-y-[15px] animate-pulse">
    {Array.from({ length: rows }).map((_, i) => (
      <FormFieldSkeleton key={i} />
    ))}
    <div className="h-[48px] bg-gray-200 rounded-[8px] w-full mt-[20px]" />
  </div>
);

/**
 * Specialized Skeleton for Interview Experience Form
 */
export const ExperienceFormSkeleton = () => (
  <div className="max-w-[800px] mx-auto px-[16px] py-[40px] animate-pulse">
    <div className="h-[20px] bg-gray-200 rounded w-[140px] mb-[24px]" />
    <div className="bg-white rounded-[16px] border border-[#E8E8E8] p-[32px]">
      <div className="h-[28px] bg-gray-200 rounded w-[60%] mb-[8px]" />
      <div className="h-[14px] bg-gray-200 rounded w-[80%] mb-[28px]" />
      <div className="space-y-[18px]">
        <FormFieldSkeleton />
        <div className="grid grid-cols-2 gap-[14px]">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <div className="grid grid-cols-2 gap-[14px]">
          <FormFieldSkeleton />
          <FormFieldSkeleton />
        </div>
        <div className="h-[200px] bg-gray-100 rounded-[8px]" />
        <div className="flex gap-[12px]">
          <div className="flex-1 h-[42px] bg-gray-200 rounded-[8px]" />
          <div className="flex-1 h-[42px] bg-gray-200 rounded-[8px]" />
        </div>
      </div>
    </div>
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
