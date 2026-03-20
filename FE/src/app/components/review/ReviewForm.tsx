"use client";
import { useState, useRef } from "react";
import { FaStar, FaXmark } from "react-icons/fa6";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

// Lazy load TinyMCE to reduce initial bundle size (~500KB saved)
const EditorMCE = dynamic(
  () => import("@/app/components/editor/EditorMCE").then(mod => mod.EditorMCE),
  { ssr: false, loading: () => <div className="h-[200px] bg-[#F9F9F9] rounded-[8px] animate-pulse" /> }
);

interface ReviewFormProps {
  companyId: string;
  companyName: string;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    overallRating: number;
    ratings: {
      salary?: number;
      workLifeBalance?: number;
      career?: number;
      culture?: number;
      management?: number;
    };
    title: string;
    content: string;
    pros: string;
    cons: string;
    isAnonymous: boolean;
  };
}

const reviewSchema = z.object({
  overallRating: z.number().min(1, "Please provide an overall rating"),
  ratings: z.object({
    salary: z.number().min(0).max(5).optional(),
    workLifeBalance: z.number().min(0).max(5).optional(),
    career: z.number().min(0).max(5).optional(),
    culture: z.number().min(0).max(5).optional(),
    management: z.number().min(0).max(5).optional(),
  }),
  title: z.string().min(5, "Review title must be at least 5 characters").max(100, "Review title must not exceed 100 characters"),
  pros: z.string().max(2000, "Pros must not exceed 2000 characters"),
  cons: z.string().max(2000, "Cons must not exceed 2000 characters"),
  isAnonymous: z.boolean(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

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

const ReviewForm = ({ companyId, companyName, onClose, onSuccess, initialData }: ReviewFormProps) => {
  const isEditing = !!initialData;
  const editorRef = useRef<any>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      overallRating: initialData?.overallRating ?? 0,
      ratings: {
        salary: initialData?.ratings?.salary ?? 0,
        workLifeBalance: initialData?.ratings?.workLifeBalance ?? 0,
        career: initialData?.ratings?.career ?? 0,
        culture: initialData?.ratings?.culture ?? 0,
        management: initialData?.ratings?.management ?? 0,
      },
      title: initialData?.title ?? "",
      pros: initialData?.pros ?? "",
      cons: initialData?.cons ?? "",
      isAnonymous: initialData?.isAnonymous ?? true,
    },
  });

  const overallRating = watch("overallRating");
  const currentRatings = watch("ratings");
  const title = watch("title");
  const pros = watch("pros");
  const cons = watch("cons");
  const isAnonymous = watch("isAnonymous");

  const onSubmit = async (data: ReviewFormData) => {
    const editorContent = editorRef.current?.getContent() || "";
    const plainTextContent = editorContent.replace(/<[^>]*>/g, "").trim();
    
    if (!plainTextContent || plainTextContent.length < 20) {
      toast.error("Review content must be at least 20 characters");
      return;
    }
    if (editorContent.length > 5000) {
      toast.error("Review content must not exceed 5000 characters");
      return;
    }

    setSubmitting(true);

    try {
      const url = isEditing
        ? `${process.env.NEXT_PUBLIC_API_URL}/review/${initialData.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/review/create`;
      const method = isEditing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...(!isEditing && { companyId, isAnonymous: data.isAnonymous }),
          overallRating: data.overallRating,
          ratings: {
            salary: data.ratings.salary || null,
            workLifeBalance: data.ratings.workLifeBalance || null,
            career: data.ratings.career || null,
            culture: data.ratings.culture || null,
            management: data.ratings.management || null
          },
          title: data.title.trim(),
          content: editorContent,
          pros: data.pros.trim(),
          cons: data.cons.trim()
        })
      });

      const resData = await res.json();

      if (resData.code === "success") {
        toast.success(resData.message);
        onSuccess();
      } else {
        toast.error(resData.message);
      }
    } catch {
      toast.error("Unable to submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-[40px]">
      <div className="bg-white rounded-[12px] w-full max-w-[700px] mx-[20px] my-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-[24px] py-[16px] border-b border-[#DEDEDE]">
          <h2 className="font-[700] text-[20px] text-[#121212]">
            {isEditing ? "Edit Review" : `Review ${companyName}`}
          </h2>
          <button
            onClick={onClose}
            className="text-[#666] hover:text-[#121212] transition-colors"
          >
            <FaXmark size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-[24px]">
          {/* Anonymous Toggle (Create Only) */}
          {!isEditing && (
            <div className="flex items-center gap-[12px] mb-[20px]">
              <label htmlFor="review-anonymous" className="flex items-center gap-[8px] cursor-pointer">
                <input
                  id="review-anonymous"
                  type="checkbox"
                  {...register("isAnonymous")}
                  className="w-[18px] h-[18px]"
                />
                <span className="text-[14px] text-[#333]">Post anonymously</span>
              </label>
            </div>
          )}

          {/* Overall Rating */}
          <div className="mb-[20px]">
            <p className="block font-[600] text-[14px] mb-[8px]">
              Overall Rating *
            </p>
            <div className="flex gap-[8px]">
              {[1, 2, 3, 4, 5].map(i => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setValue("overallRating", i, { shouldValidate: true })}
                  className="transition-transform hover:scale-110"
                >
                  <FaStar
                    className={i <= overallRating ? "text-[#FFB200]" : "text-[#E5E5E5]"}
                    size={32}
                  />
                </button>
              ))}
            </div>
            {errors.overallRating && <p className="text-[12px] text-red-500 mt-[4px]">{errors.overallRating.message}</p>}
          </div>

          {/* Category Ratings */}
          <div className="mb-[20px] bg-[#F9F9F9] rounded-[8px] p-[16px]">
            <p className="block font-[600] text-[14px] mb-[8px]">
              Rate Specific Areas (Optional)
            </p>
            <RatingInput 
              label="Salary & Benefits" 
              value={currentRatings.salary ?? 0} 
              onChange={(v) => setValue("ratings.salary", v)} 
            />
            <RatingInput 
              label="Work-Life Balance" 
              value={currentRatings.workLifeBalance ?? 0} 
              onChange={(v) => setValue("ratings.workLifeBalance", v)} 
            />
            <RatingInput 
              label="Career Growth" 
              value={currentRatings.career ?? 0} 
              onChange={(v) => setValue("ratings.career", v)} 
            />
            <RatingInput 
              label="Culture & Values" 
              value={currentRatings.culture ?? 0} 
              onChange={(v) => setValue("ratings.culture", v)} 
            />
            <RatingInput 
              label="Management" 
              value={currentRatings.management ?? 0} 
              onChange={(v) => setValue("ratings.management", v)} 
            />
          </div>

          {/* Title */}
          <div className="mb-[20px]">
            <label htmlFor="review-title" className="block font-[600] text-[14px] mb-[8px]">
              Review Title *
            </label>
            <input
              id="review-title"
              type="text"
              {...register("title")}
              placeholder="Summarize your experience in a headline"
              maxLength={100}
              autoComplete="off"
              className={`w-full h-[46px] px-[16px] border ${errors.title ? "border-red-400" : "border-[#E5E7EB]"} rounded-[10px] text-[14px] focus:border-[#0088FF] outline-none transition-all`}
            />
            <div className="flex justify-between mt-[4px]">
              {errors.title ? <p className="text-[12px] text-red-500">{errors.title.message}</p> : <div />}
              <span className="text-[12px] text-[#9CA3AF]">{title.length}/100</span>
            </div>
          </div>

          {/* Content with TinyMCE */}
          <div className="mb-[20px]">
            <label htmlFor="review-content" className="block font-[600] text-[14px] mb-[8px]">
              Your Review *
            </label>
            <EditorMCE
              editorRef={editorRef}
              value={initialData?.content ?? ""}
              id="review-content"
            />
          </div>

          {/* Pros */}
          <div className="mb-[20px]">
            <label htmlFor="review-pros" className="block font-[600] text-[14px] mb-[8px]">
              Pros (Optional)
            </label>
            <textarea
              id="review-pros"
              {...register("pros")}
              placeholder="What do you like about this company?"
              maxLength={2000}
              className={`w-full min-h-[100px] px-[14px] py-[10px] border ${errors.pros ? "border-red-400" : "border-[#E5E7EB]"} rounded-[10px] text-[14px] focus:border-[#0088FF] outline-none transition-all resize-none`}
            />
            <div className="flex justify-between mt-[4px]">
              {errors.pros ? <p className="text-[12px] text-red-500">{errors.pros.message}</p> : <div />}
              <span className="text-[12px] text-[#9CA3AF]">{pros.length}/2000</span>
            </div>
          </div>

          {/* Cons */}
          <div className="mb-[24px]">
            <label htmlFor="review-cons" className="block font-[600] text-[14px] mb-[8px]">
              Cons (Optional)
            </label>
            <textarea
              id="review-cons"
              {...register("cons")}
              placeholder="What could be improved?"
              maxLength={2000}
              className={`w-full min-h-[100px] px-[14px] py-[10px] border ${errors.cons ? "border-red-400" : "border-[#E5E7EB]"} rounded-[10px] text-[14px] focus:border-[#0088FF] outline-none transition-all resize-none`}
            />
            <div className="flex justify-between mt-[4px]">
              {errors.cons ? <p className="text-[12px] text-red-500">{errors.cons.message}</p> : <div />}
              <span className="text-[12px] text-[#9CA3AF]">{cons.length}/2000</span>
            </div>
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
              className="flex-1 h-[48px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] font-[600] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? (isEditing ? "Updating..." : "Submitting...") : (isEditing ? "Update Review" : "Submit Review")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default ReviewForm;
