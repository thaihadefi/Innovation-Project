import { cookies } from "next/headers";
import { FollowedCompaniesClient } from "./FollowedCompaniesClient";

type FollowedCompaniesPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function FollowedCompaniesPage({ searchParams }: FollowedCompaniesPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";
  const keyword = params.keyword as string || "";

  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let initialCompanies: any[] = [];
  let initialPagination: any = null;
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    if (keyword) params.set("keyword", keyword);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/followed-companies?${params.toString()}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialCompanies = data.companies || [];
      initialPagination = data.pagination || null;
    }
  } catch (error) {
    console.error("Failed to fetch followed companies:", error);
  }

  return <FollowedCompaniesClient initialCompanies={initialCompanies} initialPagination={initialPagination} />;
}
