/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { SavedJobsClient } from "./SavedJobsClient";

export default async function SavedJobsPage() {
  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let initialSavedJobs: any[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/job/saved`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialSavedJobs = data.savedJobs || [];
    }
  } catch (error) {
    console.error("Failed to fetch saved jobs:", error);
  }

  return <SavedJobsClient initialSavedJobs={initialSavedJobs} />;
}
