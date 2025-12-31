/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useRef } from "react";
import { FaStar, FaXmark } from "react-icons/fa6";
import { toast } from "sonner";
import { EditorMCE } from "@/app/components/editor/EditorMCE";

interface ReviewFormProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const RatingInput = ({ 
  label, 
  value, 
  onChange 
}: { 
  label: string; 
  value: number; 
  onChange: (v: number) => void;
}) => (
  <div className="flex items-center justify-between py-[8px]">
    <span className="text-[14px] text-[#333]">{label}</span>
    <div className="flex gap-[4px]">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          type="button"
          onClick={() => onChange(i)}
          className="transition-transform hover:scale-110"
        >
          <FaStar
            className={i <= value ? "text-[#FFB200]" : "text-[#E5E5E5]"}
            size={24}
          />
        </button>
      ))}
    </div>
  </div>
);

export const ReviewForm = ({ companyId, companyName, onClose, onSuccess }: ReviewFormProps) => {
  const editorRef = useRef<any>(null);
  const prosEditorRef = useRef<any>(null);
  const consEditorRef = useRef<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [overallRating, setOverallRating] = useState(0);
  const [ratings, setRatings] = useState({
    salary: 0,
    workLifeBalance: 0,
    career: 0,
    culture: 0,
    management: 0
  });
  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallRating === 0) {
      toast.error("Please provide an overall rating");
      return;
    }
    if (!title.trim()) {
      toast.error("Please provide a review title");
      return;
    }
    const editorContent = editorRef.current?.getContent() || "";
    
    if (!editorContent.trim()) {
      toast.error("Please write your review");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          companyId,
          isAnonymous,
          overallRating,
          ratings: {
            salary: ratings.salary || null,
            workLifeBalance: ratings.workLifeBalance || null,
            career: ratings.career || null,
            culture: ratings.culture || null,
            management: ratings.management || null
          },
          title: title.trim(),
          content: editorContent,
          pros: prosEditorRef.current?.getContent() || "",
          cons: consEditorRef.current?.getContent() || ""
        })
      });

      const data = await res.json();

      if (data.code === "success") {
        toast.success(data.message);
        onSuccess();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to submit review");
    }

    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[999] flex items-start justify-center overflow-y-auto py-[40px]">
      <div className="bg-white rounded-[12px] w-full max-w-[700px] mx-[20px] my-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#DEDEDE]">
          <h2 className="font-[700] text-[20px] text-[#121212]">
            Review {companyName}
          </h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-[#121212] transition-colors"
          >
            <FaXmark size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-[24px]">
          {/* Anonymous Toggle */}
          <div className="flex items-center gap-[12px] mb-[20px]">
            <label className="flex items-center gap-[8px] cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-[18px] h-[18px]"
              />
              <span className="text-[14px] text-[#333]">Post anonymously</span>
            </label>
          </div>

          {/* Overall Rating */}
          <div className="mb-[20px]">
            <label className="block font-[600] text-[14px] mb-[8px]">
              Overall Rating *
            </label>
            <div className="flex gap-[8px]">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setOverallRating(i)}
                  className="transition-transform hover:scale-110"
                >
                  <FaStar
                    className={i <= overallRating ? "text-[#FFB200]" : "text-[#E5E5E5]"}
                    size={32}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="mb-[20px] bg-[#F9F9F9] rounded-[8px] p-[16px]">
            <label className="block font-[600] text-[14px] mb-[8px]">
              Rate Specific Areas (Optional)
            </label>
            <RatingInput 
              label="Salary & Benefits" 
              value={ratings.salary} 
              onChange={(v) => setRatings({ ...ratings, salary: v })} 
            />
            <RatingInput 
              label="Work-Life Balance" 
              value={ratings.workLifeBalance} 
              onChange={(v) => setRatings({ ...ratings, workLifeBalance: v })} 
            />
            <RatingInput 
              label="Career Growth" 
              value={ratings.career} 
              onChange={(v) => setRatings({ ...ratings, career: v })} 
            />
            <RatingInput 
              label="Culture & Values" 
              value={ratings.culture} 
              onChange={(v) => setRatings({ ...ratings, culture: v })} 
            />
            <RatingInput 
              label="Management" 
              value={ratings.management} 
              onChange={(v) => setRatings({ ...ratings, management: v })} 
            />
          </div>

          {/* Title */}
          <div className="mb-[20px]">
            <label className="block font-[600] text-[14px] mb-[8px]">
              Review Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Summarize your experience in a headline"
              maxLength={100}
              className="w-full h-[46px] px-[16px] border border-[#DEDEDE] rounded-[8px] text-[14px]"
            />
          </div>

          {/* Content with TinyMCE */}
          <div className="mb-[20px]">
            <label className="block font-[600] text-[14px] mb-[8px]">
              Your Review *
            </label>
            <EditorMCE
              editorRef={editorRef}
              value=""
              id="review-content"
            />
          </div>

          {/* Pros */}
          <div className="mb-[20px]">
            <label className="block font-[600] text-[14px] mb-[8px]">
              Pros (Optional)
            </label>
            <EditorMCE
              editorRef={prosEditorRef}
              value=""
              id="review-pros"
            />
          </div>

          {/* Cons */}
          <div className="mb-[24px]">
            <label className="block font-[600] text-[14px] mb-[8px]">
              Cons (Optional)
            </label>
            <EditorMCE
              editorRef={consEditorRef}
              value=""
              id="review-cons"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-[12px]">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[48px] border border-[#DEDEDE] rounded-[8px] font-[600] text-[#666] hover:bg-[#F9F9F9] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 h-[48px] bg-[#0088FF] rounded-[8px] font-[600] text-white hover:bg-[#0077DD] transition-colors disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Review"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
