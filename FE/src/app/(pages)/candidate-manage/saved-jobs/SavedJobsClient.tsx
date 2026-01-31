"use client";
import { useState } from "react";
import Link from "next/link";
import { FaBriefcase, FaXmark, FaMagnifyingGlass } from "react-icons/fa6";
import { toast, Toaster } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";

export const SavedJobsClient = ({ initialSavedJobs }: { initialSavedJobs: any[] }) => {
  const [savedJobs, setSavedJobs] = useState<any[]>(initialSavedJobs);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Filter jobs based on search
  const filteredJobs = searchQuery.trim() === ""
    ? savedJobs
    : savedJobs.filter(s => 
        s.job?.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.job?.companyId?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleUnsave = (jobId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/job/save/${jobId}`, {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success" && !data.saved) {
          setSavedJobs(prev => prev.filter(s => s.job?._id !== jobId));
          toast.success("Job removed from saved!");
        }
      });
  };

  // Pagination
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const paginatedJobs = filteredJobs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
      <Toaster richColors position="top-right" />
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
          <h1 className="font-[700] text-[24px] text-[#121212]">
            Saved Jobs ({filteredJobs.length})
          </h1>
          
          {/* Search */}
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-[12px] top-[50%] translate-y-[-50%] text-[#999]" />
            <input
              type="text"
              placeholder="Search job or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-[36px] pr-[16px] py-[10px] border border-[#DEDEDE] rounded-[4px] w-[250px] text-[14px]"
            />
          </div>
        </div>

        {filteredJobs.length === 0 ? (
          <div className="text-center py-[40px]">
            <FaBriefcase className="text-[48px] text-[#ccc] mx-auto mb-[16px]" />
            <p className="text-[#666] mb-[16px]">
              {searchQuery ? "No jobs found." : "You haven't saved any jobs yet."}
            </p>
            {!searchQuery && (
              <Link
                href="/search"
                className="inline-block bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[24px] py-[12px] rounded-[8px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Browse Jobs
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
              {paginatedJobs.map((saved) => {
                // Calculate expiration status
                const getExpirationInfo = () => {
                  if (!saved.job?.expirationDate) return null;
                  if (saved.job?.isExpired) return { status: "expired", label: "Expired" };
                  const expDate = new Date(saved.job.expirationDate);
                  const now = new Date();
                  const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                  
                  if (diffDays < 0) return { status: "expired", label: "Expired" };
                  if (diffDays === 0) return { status: "expiring", label: "Expires today" };
                  if (diffDays <= 7) return { status: "expiring", label: `${diffDays} day${diffDays > 1 ? "s" : ""} left` };
                  return null;
                };
                const expirationInfo = getExpirationInfo();
                const isExpired = saved.job?.isExpired || expirationInfo?.status === "expired";

                return (
                  <div
                    key={saved.savedId}
                    className={`border border-[#DEDEDE] rounded-[8px] p-[16px] relative group hover:border-[#0088FF] transition-colors ${isExpired ? "opacity-60" : ""}`}
                  >
                    {/* Expired badge */}
                    {isExpired && (
                      <div className="absolute top-[8px] left-[8px] bg-red-500 text-white text-[10px] font-[600] px-[8px] py-[2px] rounded-[4px]">
                        Expired
                      </div>
                    )}
                    {/* Expiring soon badge */}
                    {!isExpired && expirationInfo?.status === "expiring" && (
                      <div className="absolute top-[8px] left-[8px] bg-orange-500 text-white text-[10px] font-[600] px-[8px] py-[2px] rounded-[4px]">
                        {expirationInfo.label}
                      </div>
                    )}
                    
                    <button
                      onClick={() => handleUnsave(saved.job?._id)}
                      className="absolute top-[8px] right-[8px] p-[8px] rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                      title="Remove from saved"
                    >
                      <FaXmark className="text-[14px]" />
                    </button>
                    
                    <Link href={`/job/detail/${saved.job?.slug}`} className="block">
                      <div className="flex items-center gap-[12px] mb-[12px]">
                        {saved.job?.companyId?.logo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={saved.job.companyId.logo}
                            alt={saved.job.companyId.companyName || "Logo"}
                            width={50}
                            height={50}
                            className="w-[50px] h-[50px] rounded-[4px] object-cover bg-[#F6F6F6]"
                            loading="eager"
                            decoding="async"
                          />
                        ) : (
                          <div className="w-[50px] h-[50px] rounded-[4px] bg-gray-200 flex items-center justify-center">
                            <FaBriefcase className="text-[20px] text-gray-400" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <h3 className="font-[600] text-[15px] text-[#121212] hover:text-[#0088FF] truncate">
                            {saved.job?.title}
                          </h3>
                          <p className="text-[13px] text-[#666] truncate">
                            {saved.job?.companyId?.companyName}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-[8px] text-[12px] text-[#666]">
                        {saved.job?.salaryMin && saved.job?.salaryMax && (
                          <span className="bg-[#f5f5f5] px-[8px] py-[4px] rounded-[4px]">
                            {saved.job.salaryMin.toLocaleString("vi-VN")} VND - {saved.job.salaryMax.toLocaleString("vi-VN")} VND
                          </span>
                        )}
                        {saved.savedAt && (
                          <span className="text-[#999]">
                            Saved {new Date(saved.savedAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                          </span>
                        )}
                      </div>
                    </Link>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPage={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
