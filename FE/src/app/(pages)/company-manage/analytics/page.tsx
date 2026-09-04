import { cookies } from "next/headers";
import {
  AnalyticsClient,
  type OverviewStats,
  type JobStats,
  type ChartJob,
  type SortMetric,
  type TimeRange,
} from "./AnalyticsClient";
import { getServerApiUrl } from "@/utils/get-server-api-url";
import type { PaginationMeta } from "@/types/pagination";

type AnalyticsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";
  const sortBy = params.sortBy as string || "views";
  const timeRange = params.timeRange as string || "30d";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let overview: OverviewStats | null = null;
  let jobs: JobStats[] = [];
  let chartJobs: ChartJob[] = [];
  let jobsPagination: PaginationMeta | null = null;
  let controls: { sortBy: SortMetric; timeRange: TimeRange } = { sortBy: "views", timeRange: "30d" };
  let hasAnyJobs = false;

  try {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("sortBy", sortBy);
    params.set("timeRange", timeRange);
    const res = await fetch(
      `${apiUrl}/company/analytics?${params.toString()}`,
      {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();

    if (data.code === "success") {
      overview = data.overview;
      jobs = data.jobs || [];
      chartJobs = data.chartJobs || [];
      jobsPagination = data.jobsPagination || null;
      controls = data.controls || controls;
      hasAnyJobs = !!data.hasAnyJobs;
    }
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
  }

  return (
    <AnalyticsClient
      initialOverview={overview}
      initialJobs={jobs}
      initialChartJobs={chartJobs}
      initialJobsPagination={jobsPagination}
      initialControls={controls}
      initialHasAnyJobs={hasAnyJobs}
    />
  );
}
