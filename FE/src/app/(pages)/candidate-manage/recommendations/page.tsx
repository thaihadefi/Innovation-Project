import { cookies } from "next/headers";
import { RecommendationsClient } from "./RecommendationsClient";

import { getServerApiUrl } from "@/utils/get-server-api-url";
import type { JobCard } from "@/types/job";

export default async function RecommendationsPage() {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let initialRecommendations: JobCard[] = [];
  let initialBasedOn: string[] | string = [];
  let initialFallback = false;
  let initialMessage = "";

  try {
    const res = await fetch(`${apiUrl}/candidate/recommendations`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialRecommendations = data.recommendations || [];
      initialBasedOn = data.basedOn || [];
      initialFallback = data.fallback || false;
      initialMessage = data.message || "";
    }
  } catch (error) {
    console.error("Failed to fetch recommendations:", error);
  }

  return (
    <RecommendationsClient
      initialRecommendations={initialRecommendations}
      initialBasedOn={initialBasedOn}
      initialFallback={initialFallback}
      initialMessage={initialMessage}
    />
  );
}
