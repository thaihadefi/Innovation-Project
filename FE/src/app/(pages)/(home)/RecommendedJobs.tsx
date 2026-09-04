"use client";
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { JobCardSkeleton } from "@/app/components/ui/CardSkeleton";
import { useEffect, useState } from "react";
import { FaLightbulb, FaArrowRight } from "react-icons/fa6";
import Link from "next/link";
import type { ServerAuth } from "@/types/auth";
import type { JobCard } from "@/types/job";

interface RecommendedJobsProps {
  serverAuth: ServerAuth;
  initialRecommendations?: JobCard[];
}

export const RecommendedJobs = ({ serverAuth, initialRecommendations = [] }: RecommendedJobsProps) => {
  const infoCandidate = serverAuth?.infoCandidate;
  const [recommendations, setRecommendations] = useState<JobCard[]>(initialRecommendations);
  const [loading, setLoading] = useState(false);

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
    if (infoCandidate && initialRecommendations.length === 0) {
      setLoading(true);
      fetchRecommendations();
    }
  }, [infoCandidate, initialRecommendations.length]);

  if (!infoCandidate) return null;
  
  if (!loading && recommendations.length === 0) return null;

  return (
    <div className="py-[60px] bg-gradient-to-b from-[#E6F4FF] to-white">
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[30px]">
          <h2 className="font-[700] text-[24px] sm:text-[28px] text-[#121212] flex items-center gap-[12px]">
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
          {loading ? (
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
