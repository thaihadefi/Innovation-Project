import Link from "next/link";
import { JobList } from "./JobList";

export default function Page() {
  return (
    <>
      {/* Manage Jobs */}
      <div className="py-[60px]">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-[20px] mb-[20px]">
            <h1 className="font-[700] sm:text-[28px] text-[24px] text-[#121212]">
              Manage Jobs
            </h1>
            <Link
              href="/company-manage/job/create"
              className="bg-[#0088FF] rounded-[8px] py-[8px] px-[20px] font-[400] text-[14px] text-white hover:bg-[#0070d6] transition-colors duration-200"
            >
              Add New
            </Link>
          </div>
          <JobList />
        </div>
      </div>
      {/* End Manage Jobs */}
    </>
  )
}