/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { FollowedCompaniesClient } from "./FollowedCompaniesClient";

export default async function FollowedCompaniesPage() {
  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let initialCompanies: any[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/followed-companies`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialCompanies = data.companies || [];
    }
  } catch (error) {
    console.error("Failed to fetch followed companies:", error);
  }

  return <FollowedCompaniesClient initialCompanies={initialCompanies} />;
}
