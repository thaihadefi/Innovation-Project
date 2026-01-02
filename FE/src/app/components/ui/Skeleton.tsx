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
