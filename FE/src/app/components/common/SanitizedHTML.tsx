"use client";
import DOMPurify from "isomorphic-dompurify";

interface SanitizedHTMLProps {
  html: string;
  className?: string;
}

export const SanitizedHTML = ({ html, className = "" }: SanitizedHTMLProps) => {
  const sanitizedHtml = DOMPurify.sanitize(html || "");
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  );
};
