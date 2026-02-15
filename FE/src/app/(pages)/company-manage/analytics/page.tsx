import { cookies } from "next/headers";
import { AnalyticsClient } from "./AnalyticsClient";

type AnalyticsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function AnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";
  const sortBy = params.sortBy as string || "views";
  const timeRange = params.timeRange as string || "30d";

  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let overview: any = null;
  let jobs: any[] = [];
  let chartJobs: any[] = [];
  let jobsPagination: any = null;
  let controls: any = { sortBy: "views", timeRange: "30d" };
  let hasAnyJobs = false;

  try {
    const params = new URLSearchParams();
    params.set("page", page);
    params.set("sortBy", sortBy);
    params.set("timeRange", timeRange);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/company/analytics?${params.toString()}`,
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
