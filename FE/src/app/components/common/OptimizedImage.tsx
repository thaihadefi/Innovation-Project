"use client";
import Image from "next/image";
import { useState } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fill?: boolean;
  priority?: boolean;
}

/**
 * Optimized image component using next/image with fallback.
 * Handles external images from Cloudinary and other sources.
 * Falls back to regular img tag if next/image fails.
 */
export const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  className = "",
  fill = false,
  priority = false,
}: OptimizedImageProps) => {
  const [error, setError] = useState(false);

  // If no src or error occurred, show placeholder
  if (!src || error) {
    return (
      <div 
        className={`bg-[#E5E5E5] flex items-center justify-center ${className}`}
        style={!fill ? { width, height } : undefined}
      >
        <span className="text-[#999] text-[12px]">No image</span>
      </div>
    );
  }

  // Use regular img for data URLs or non-http URLs
  if (src.startsWith("data:") || (!src.startsWith("http") && !src.startsWith("/"))) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        width={width}
        height={height}
      />
    );
  }

  // Use next/image for optimization
  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : (width || 100)}
      height={fill ? undefined : (height || 100)}
      fill={fill}
      priority={priority}
      className={className}
      onError={() => setError(true)}
      unoptimized={src.includes("localhost")} // Don't optimize local dev images
    />
  );
};
