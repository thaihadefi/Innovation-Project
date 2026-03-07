"use client";
import { useState } from "react";
import { toast } from "sonner";
import { FaThumbsUp } from "react-icons/fa6";

export const ExperienceHelpful = ({
  postId,
  initialHelpfulCount,
  initialIsHelpful,
  isLoggedIn,
}: {
  postId: string;
  initialHelpfulCount: number;
  initialIsHelpful: boolean;
  isLoggedIn: boolean;
}) => {
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [isHelpful, setIsHelpful] = useState(initialIsHelpful);
  const [loading, setLoading] = useState(false);

  const toggleHelpful = async () => {
    if (!isLoggedIn) {
      toast.info("Please login to mark posts as helpful.");
      return;
    }
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${postId}/helpful`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.code === "success") {
        setIsHelpful(data.isHelpful);
        setHelpfulCount(data.helpfulCount);
        toast.success(data.isHelpful ? "Marked as helpful" : "Unmarked");
      } else {
        toast.error(data.message || "Failed to update.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-[24px] pt-[20px] border-t border-[#F0F0F0]">
      <button
        onClick={toggleHelpful}
        disabled={loading}
        className={`inline-flex items-center gap-[8px] px-[16px] py-[8px] rounded-[8px] text-[14px] font-[500] transition-all duration-200 cursor-pointer disabled:opacity-60 ${
          isHelpful
            ? "bg-[#0088FF] text-white hover:bg-[#006FCC]"
            : "border border-[#DEDEDE] text-[#666] hover:border-[#0088FF] hover:text-[#0088FF] hover:bg-[#0088FF]/5"
        }`}
      >
        <FaThumbsUp className="text-[13px]" />
        Helpful ({helpfulCount})
      </button>
    </div>
  );
};
