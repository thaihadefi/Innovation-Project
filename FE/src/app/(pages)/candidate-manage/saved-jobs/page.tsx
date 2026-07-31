import { cookies } from "next/headers";
import { SavedJobsClient } from "./SavedJobsClient";

import { getServerApiUrl } from "@/utils/get-server-api-url";

type SavedJobsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SavedJobsPage({ searchParams }: SavedJobsPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";
  const keyword = params.keyword as string || "";

  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let initialSavedJobs: any[] = [];
  let initialPagination: any = null;
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    if (keyword) params.set("keyword", keyword);
    const res = await fetch(`${apiUrl}/candidate/job/saved?${params.toString()}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialSavedJobs = data.savedJobs || [];
      initialPagination = data.pagination || null;
    }
  } catch (error) {
    console.error("Failed to fetch saved jobs:", error);
  }

  return <SavedJobsClient initialSavedJobs={initialSavedJobs} initialPagination={initialPagination} />;
}
