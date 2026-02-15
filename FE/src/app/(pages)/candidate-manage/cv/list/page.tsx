import { CVList } from "./CVList";
import { cookies } from "next/headers";

type CandidateCVListPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: CandidateCVListPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";
  const keyword = params.keyword as string || "";

  // Fetch candidate info and CV list on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  
  let isVerified = false;
  let initialCVList: any[] = [];
  let initialPagination: any = null;
  
  try {
    const cvListParams = new URLSearchParams();
    cvListParams.set("page", page);
    if (keyword) cvListParams.set("keyword", keyword);
    const [authRes, cvListRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store"
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/list?${cvListParams.toString()}`, {
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
      {/* Submitted Applications */}
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
      {/* End Submitted Applications */}
    </>
  )
}
