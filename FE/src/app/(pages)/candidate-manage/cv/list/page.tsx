import { CVList, type CandidateApplication } from "./CVList";
import { cookies } from "next/headers";

import { getServerApiUrl } from "@/utils/get-server-api-url";
import type { PaginationMeta } from "@/types/pagination";

type CandidateCVListPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: CandidateCVListPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";
  const keyword = params.keyword as string || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();
  
  let isVerified = false;
  let initialCVList: CandidateApplication[] = [];
  let initialPagination: PaginationMeta | null = null;
  
  try {
    const cvListParams = new URLSearchParams();
    cvListParams.set("page", page);
    if (keyword) cvListParams.set("keyword", keyword);
    const [authRes, cvListRes] = await Promise.all([
      fetch(`${apiUrl}/auth/check`, {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store"
      }),
      fetch(`${apiUrl}/candidate/cv/list?${cvListParams.toString()}`, {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store"
      })
    ]);
    
    const authData = await authRes.json();
    if (authData.code === "success" && authData.infoCandidate) {
      isVerified = authData.infoCandidate.isVerified || false;
    }
    
    const cvListData = await cvListRes.json();
    if (cvListData.code === "success") {
      initialCVList = cvListData.cvList || [];
      initialPagination = cvListData.pagination || null;
    }
  } catch (error) {
    console.error("Failed to fetch data:", error);
  }

  return (
    <>
      
      <div className="py-[60px]">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-[20px] mb-[20px]">
            <h1 className="font-[700] text-[24px] sm:text-[28px] text-[#121212]">
              Submitted Applications
            </h1>
          </div>
          <CVList isVerified={isVerified} initialCVList={initialCVList} initialPagination={initialPagination} />
        </div>
      </div>
      
    </>
  )
}
