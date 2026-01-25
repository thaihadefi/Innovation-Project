"use client"
import { useState, useEffect } from "react";
import { FaArrowUp } from "react-icons/fa6";

export const BackToTop = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      // Hiển thị nút khi scroll xuống 300px
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", toggleVisibility);
    return () => window.removeEventListener("scroll", toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-[30px] right-[30px] z-50 w-[48px] h-[48px] bg-[#0088FF] hover:bg-[#0066CC] text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center cursor-pointer transition-all duration-300 ${
        isVisible 
          ? "opacity-100 translate-y-0" 
          : "opacity-0 translate-y-[20px] pointer-events-none"
      }`}
      aria-label="Back to top"
    >
      <FaArrowUp className="text-[18px]" />
    </button>
  );
};
