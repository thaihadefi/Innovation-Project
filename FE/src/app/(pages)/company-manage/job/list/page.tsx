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
              className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] py-[8px] px-[20px] font-[400] text-[14px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
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