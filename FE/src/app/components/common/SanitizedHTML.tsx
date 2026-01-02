"use client";
import DOMPurify from "dompurify";

interface SanitizedHTMLProps {
  html: string;
  className?: string;
}

/**
 * A reusable component for safely rendering HTML content.
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks.
 * Must be used as a Client Component since DOMPurify requires browser DOM.
 */
export const SanitizedHTML = ({ html, className = "" }: SanitizedHTMLProps) => {
  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(html || "") }} 
    />
  );
};
