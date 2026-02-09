"use client";
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { FaLightbulb, FaArrowRight } from "react-icons/fa6";
import { FaExclamationTriangle } from "react-icons/fa";
import Link from "next/link";

interface RecommendationsClientProps {
  initialRecommendations: any[];
  initialBasedOn: string[] | string;
  initialFallback: boolean;
  initialMessage: string;
}

export const RecommendationsClient = ({
  initialRecommendations,
  initialBasedOn,
  initialFallback,
  initialMessage
}: RecommendationsClientProps) => {
  return (
    <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[24px]">
          <div>
            <h1 className="font-[700] text-[24px] text-[#121212] flex items-center gap-[12px]">
              <FaLightbulb className="text-[#FFB200]" />
              Recommended Jobs
            </h1>
            {Array.isArray(initialBasedOn) && initialBasedOn.length > 0 && (
              <p className="text-[#666] text-[14px] mt-[8px]">
                Based on your skills: {initialBasedOn.join(", ")}
              </p>
            )}
            {initialFallback && initialMessage && (
              <p className="text-[#FFB200] text-[14px] mt-[4px] flex items-center gap-1">
                <FaExclamationTriangle /> {initialMessage}
              </p>
            )}
          </div>
          <Link
            href="/candidate-manage/profile"
            className="flex items-center gap-[8px] px-[16px] py-[10px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white rounded-[8px] font-[600] text-[14px] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
          >
            Update Skills <FaArrowRight />
          </Link>
        </div>

        {initialRecommendations.length === 0 ? (
          <div className="text-center py-[60px] bg-[#F5F5F5] rounded-[8px]">
            <FaLightbulb className="text-[48px] text-[#ccc] mx-auto mb-[16px]" />
            <h3 className="font-[700] text-[20px] text-[#121212] mb-[8px]">
              No recommendations
            </h3>
            <p className="text-[#666] text-[14px] mb-[16px]">
              {initialMessage || "Add skills to your profile to get personalized recommendations"}
            </p>
            <Link
              href="/candidate-manage/profile"
              className="inline-block px-[24px] py-[12px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white rounded-[8px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              Update Your Skills
            </Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
            {initialRecommendations.map((job, index) => (
              <CardJobItem key={job.id || job._id || `job-${index}`} item={job} />
            ))}
          </div>
        )}

        {/* Browse All Jobs Link */}
        {initialRecommendations.length > 0 && (
          <div className="text-center mt-[32px]">
            <Link
              href="/search"
              className="inline-flex items-center gap-[8px] text-[#0088FF] hover:underline font-[600]"
            >
              Browse All Jobs <FaArrowRight />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};
