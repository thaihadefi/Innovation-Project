import { Suspense } from "react";
import { SearchContainer } from "./SearchContainer";
import { JobCardSkeleton } from "@/app/components/ui/CardSkeleton";

function SearchFallback() {
  return (
    <div className="py-[60px]">
      <div className="container">
        <div className="h-[36px] w-[200px] bg-gray-200 animate-pulse rounded mb-[30px]"></div>
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
          {Array(6).fill(null).map((_, i) => <JobCardSkeleton key={`skeleton-${i}`} />)}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchContainer />
    </Suspense>
  );
}
