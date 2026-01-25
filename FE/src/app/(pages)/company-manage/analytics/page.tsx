/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { AnalyticsClient } from "./AnalyticsClient";

export default async function AnalyticsPage() {
  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let overview: any = null;
  let jobs: any[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/analytics`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();

    if (data.code === "success") {
      overview = data.overview;
      jobs = data.jobs || [];
    }
  } catch (error) {
    console.error("Failed to fetch analytics:", error);
  }

  return <AnalyticsClient initialOverview={overview} initialJobs={jobs} />;
}
