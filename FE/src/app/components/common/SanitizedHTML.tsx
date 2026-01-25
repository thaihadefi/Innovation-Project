"use client";
import DOMPurify from "isomorphic-dompurify";

interface SanitizedHTMLProps {
  html: string;
  className?: string;
}

/**
 * A reusable component for safely rendering HTML content.
 * Uses isomorphic-dompurify to sanitize HTML and prevent XSS attacks.
 * Works on both server-side and client-side rendering.
 */
export const SanitizedHTML = ({ html, className = "" }: SanitizedHTMLProps) => {
  const sanitizedHtml = DOMPurify.sanitize(html || "");
  
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: sanitizedHtml }} 
    />
  );
};
