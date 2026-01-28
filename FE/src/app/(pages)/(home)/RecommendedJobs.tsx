"use client";
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { JobCardSkeleton } from "@/app/components/ui/CardSkeleton";
import { useEffect, useState } from "react";
import { FaLightbulb, FaArrowRight } from "react-icons/fa6";
import Link from "next/link";

interface ServerAuth {
  infoCandidate: any;
  infoCompany: any;
}

interface RecommendedJobsProps {
  serverAuth: ServerAuth | null;
  initialRecommendations?: any[];
}

export const RecommendedJobs = ({ serverAuth, initialRecommendations = [] }: RecommendedJobsProps) => {
  const infoCandidate = serverAuth?.infoCandidate;
  const [recommendations, setRecommendations] = useState<any[]>(initialRecommendations);
  const [loading, setLoading] = useState(false); // No loading if we have initial data

  const fetchRecommendations = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/recommendations`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setRecommendations(data.recommendations?.slice(0, 6) || []);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    // Only fetch if no initial data provided (fallback for client-side navigation)
    if (infoCandidate && initialRecommendations.length === 0) {
      setLoading(true);
      fetchRecommendations();
    }
  }, [infoCandidate, initialRecommendations.length]);

  // Don't show section for non-candidates
  if (!infoCandidate) return null;
  
  // Don't show if no recommendations and done loading
  if (!loading && recommendations.length === 0) return null;

  return (
    <div className="py-[60px] bg-gradient-to-b from-[#E6F4FF] to-white">
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[30px]">
          <h2 className="font-[700] sm:text-[28px] text-[24px] text-[#121212] flex items-center gap-[12px]">
            <FaLightbulb className="text-[#FFB200]" />
            Recommended for You
          </h2>
          {!loading && (
            <Link
              href="/candidate-manage/recommendations"
              className="flex items-center gap-[8px] text-[#0088FF] font-[600] hover:underline"
            >
              View All <FaArrowRight />
            </Link>
          )}
        </div>
        
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
          {loading ? (
            // Show skeleton while loading
            Array(3).fill(null).map((_, i) => <JobCardSkeleton key={i} />)
          ) : (
            recommendations.map((job, index) => (
              <CardJobItem key={job._id || job.id || `rec-${index}`} item={job} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};
