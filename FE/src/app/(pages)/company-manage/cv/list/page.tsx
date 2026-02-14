import { cookies } from "next/headers";
import { CVList } from "./CVList";

type CompanyCVListPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: CompanyCVListPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";
  const keyword = params.keyword as string || "";

  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let initialCVList: any[] = [];
  let initialPagination: any = null;
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/cv/list?page=${page}&keyword=${keyword}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialCVList = data.cvList || [];
      initialPagination = data.pagination || null;
    }
  } catch (error) {
    console.error("Failed to fetch CV list:", error);
  }

  return (
    <>
      {/* Manage Applications */}
      <div className="py-[60px]">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-[20px] mb-[20px]">
            <h1 className="font-[700] text-[24px] sm:text-[28px] text-[#121212]">
              Manage Applications
            </h1>
          </div>
          <CVList initialCVList={initialCVList} initialPagination={initialPagination} />
        </div>
      </div>
      {/* End Manage Applications */}
    </>
  )
}
