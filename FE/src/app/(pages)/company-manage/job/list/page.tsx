import Link from "next/link";
import { cookies } from "next/headers";
import { JobList } from "./JobList";

type CompanyJobListPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function Page({ searchParams }: CompanyJobListPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";
  const keyword = params.keyword as string || "";

  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let jobList: any[] = [];
  let initialPagination: any = null;

  try {
    const params = new URLSearchParams();
    params.set("page", page);
    if (keyword) params.set("keyword", keyword);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/job/list?${params.toString()}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();

    if (data.code === "success") {
      jobList = data.jobList || [];
      initialPagination = {
        totalRecord: data.totalRecord || 0,
        totalPage: data.totalPage || 1,
        currentPage: data.currentPage || 1,
        pageSize: data.pageSize || 6
      };
    }
  } catch (error) {
    console.error("Failed to fetch job list:", error);
  }

  return (
    <>
      {/* Manage Jobs */}
      <div className="py-[60px]">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-[20px] mb-[20px]">
            <h1 className="font-[700] text-[24px] sm:text-[28px] text-[#121212]">
              Manage Jobs
            </h1>
            <Link
              href="/company-manage/job/create"
              className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] py-[8px] px-[20px] font-[400] text-[14px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              Add New
            </Link>
          </div>
          <JobList initialJobList={jobList} initialPagination={initialPagination} />
        </div>
      </div>
      {/* End Manage Jobs */}
    </>
  )
}
