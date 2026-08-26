"use client";
import { useState } from "react";
import Image from "next/image";

interface CompanyLogoImageProps {
  src: string | null | undefined;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

export const CompanyLogoImage = ({ src, alt, width, height, className, priority }: CompanyLogoImageProps) => {
  const [error, setError] = useState(false);

  if (src && !error) {
    return (
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className ?? "w-full h-full object-contain"}
        priority={priority}
        unoptimized
        onError={() => setError(true)}
      />
    );
  }

  return (
    <div className="w-full h-full bg-[#F6F6F6] flex items-center justify-center">
      <span className="text-[#999]">No logo</span>
    </div>
  );
};
