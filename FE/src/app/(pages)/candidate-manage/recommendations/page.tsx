/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { RecommendationsClient } from "./RecommendationsClient";

export default async function RecommendationsPage() {
  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let initialRecommendations: any[] = [];
  let initialBasedOn: string[] | string = [];
  let initialFallback = false;
  let initialMessage = "";

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/recommendations`, {
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
