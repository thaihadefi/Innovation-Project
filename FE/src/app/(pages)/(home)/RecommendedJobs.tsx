/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";
import { FaLightbulb, FaArrowRight } from "react-icons/fa6";
import Link from "next/link";

export const RecommendedJobs = () => {
  const { infoCandidate } = useAuth();
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (infoCandidate) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [infoCandidate]);

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

  // Only show for logged-in candidates
  if (!infoCandidate || loading) return null;
  if (recommendations.length === 0) return null;

  return (
    <div className="py-[60px] bg-gradient-to-b from-[#E6F4FF] to-white">
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[30px]">
          <h2 className="font-[700] sm:text-[28px] text-[24px] text-[#121212] flex items-center gap-[12px]">
            <FaLightbulb className="text-[#FFB200]" />
            Recommended for You
          </h2>
          <Link
            href="/candidate-manage/recommendations"
            className="flex items-center gap-[8px] text-[#0088FF] font-[600] hover:underline"
          >
            View All <FaArrowRight />
          </Link>
        </div>
        
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
          {recommendations.map((job) => (
            <CardJobItem key={job.id} item={job} />
          ))}
        </div>
      </div>
    </div>
  );
};
