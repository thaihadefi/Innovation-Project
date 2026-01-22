import { Section1 } from "@/app/components/section/Section1";
import dynamic from "next/dynamic";
import { Suspense } from "react";
import { JobCardSkeleton, CardSkeletonGrid } from "@/app/components/ui/CardSkeleton";
import { Section2 } from "./Section2";

// Dynamic import for RecommendedJobs (client component - needs auth)
const RecommendedJobs = dynamic(() => import("./RecommendedJobs").then(mod => ({ default: mod.RecommendedJobs })), {
  loading: () => (
    <div className="py-[60px] bg-gradient-to-b from-[#E6F4FF] to-white">
      <div className="container">
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
          {Array(3).fill(null).map((_, i) => <JobCardSkeleton key={i} />)}
        </div>
      </div>
    </div>
  ),
});

// Skeleton for Section2 ISR loading
const Section2Skeleton = () => (
  <div className="py-[60px]">
    <div className="container">
      <h2 className="text-center font-[700] sm:text-[28px] text-[24px] text-[#121212] mb-[30px]">
        Top Employers
      </h2>
      <CardSkeletonGrid count={6} type="company" />
    </div>
  </div>
);

export default function HomePage() {
  return (
    <>
      {/* Section 1 */}
      <Section1 />
      {/* End Section 1 */}

      {/* Recommended Jobs - Shows only for logged-in candidates */}
      <RecommendedJobs />
      {/* End Recommended Jobs */}

      {/* Section 2 - ISR enabled, server-side rendered */}
      <Suspense fallback={<Section2Skeleton />}>
        <Section2 />
      </Suspense>
      {/* End Section 2 */}
    </>
  );
}
