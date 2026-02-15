"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBriefcase, FaXmark, FaMagnifyingGlass } from "react-icons/fa6";
import { toast, Toaster } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { useListQueryState } from "@/hooks/useListQueryState";
import { normalizeKeyword } from "@/utils/keyword";

type SavedJobsClientProps = {
  initialSavedJobs: any[];
  initialPagination?: {
    totalRecord: number;
    totalPage: number;
    currentPage: number;
    pageSize: number;
  } | null;
};

export const SavedJobsClient = ({ initialSavedJobs, initialPagination = null }: SavedJobsClientProps) => {
  const { queryKey, getPage, getKeyword, replaceQuery } = useListQueryState();
  const initialKeyword = getKeyword();

  const [savedJobs, setSavedJobs] = useState<any[]>(initialSavedJobs);
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [currentPage, setCurrentPage] = useState(initialPagination?.currentPage || 1);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const isFirstLoad = useRef(true);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchSavedJobs = useCallback(async (page: number, keyword: string) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      const normalizedKeyword = normalizeKeyword(keyword);
      if (normalizedKeyword.isValid && normalizedKeyword.value) {
        params.set("keyword", normalizedKeyword.value);
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/job/saved?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.code === "success") {
        setSavedJobs(data.savedJobs || []);
        setPagination(data.pagination || null);
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Failed to fetch saved jobs:", error);
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      fetchAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    const pageFromUrl = getPage();
    const keywordFromUrl = getKeyword();
    setCurrentPage((prev) => (prev === pageFromUrl ? prev : pageFromUrl));
    setSearchQuery((prev) => (prev === keywordFromUrl ? prev : keywordFromUrl));
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    fetchSavedJobs(pageFromUrl, keywordFromUrl);
  }, [fetchSavedJobs, getKeyword, getPage, queryKey]);

  const applySearch = () => {
    const normalizedKeyword = normalizeKeyword(searchQuery);
    replaceQuery({ page: 1, keyword: normalizedKeyword.isValid ? normalizedKeyword.value : "" });
  };

  const activeKeyword = getKeyword();

  const handleUnsave = (jobId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/job/save/${jobId}`, {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success" && !data.saved) {
          toast.success("Job removed from saved.");
          fetchSavedJobs(currentPage, activeKeyword);
        }
      });
  };

  return (
    <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
      <Toaster richColors position="top-right" />
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
          <h1 className="font-[700] text-[24px] text-[#121212]">
            Saved Jobs ({pagination?.totalRecord || 0})
          </h1>

          <div className="relative">
            <FaMagnifyingGlass className="absolute left-[12px] top-[50%] translate-y-[-50%] text-[#999]" />
            <input
              type="text"
              placeholder="Search job or company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  applySearch();
                }
              }}
              className="pl-[36px] pr-[16px] py-[10px] border border-[#DEDEDE] rounded-[4px] w-[250px] text-[14px]"
            />
          </div>
          <button
            type="button"
            onClick={applySearch}
            className="px-[14px] py-[10px] rounded-[4px] bg-[#0088FF] text-white text-[13px] font-[600] hover:bg-[#0077EE]"
          >
            Search
          </button>
        </div>

        {loading ? (
          <div className="text-center py-[40px] text-[#666]">Loading...</div>
        ) : savedJobs.length === 0 ? (
          <div className="text-center py-[40px]">
            <FaBriefcase className="text-[48px] text-[#ccc] mx-auto mb-[16px]" />
            <p className="text-[#666] mb-[16px]">
              {activeKeyword ? "No jobs found." : "You haven't saved any jobs yet."}
            </p>
            {!activeKeyword && (
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
              {savedJobs.map((saved) => {
                const getExpirationInfo = () => {
                  if (!saved.job?.expirationDate) return null;
                  if (saved.job?.isExpired) return { status: "expired", label: "Expired" };
                  const expDate = new Date(saved.job.expirationDate);
                  const now = new Date();
                  const expUTC = Date.UTC(expDate.getUTCFullYear(), expDate.getUTCMonth(), expDate.getUTCDate());
                  const nowUTC = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
                  const diffDays = Math.ceil((expUTC - nowUTC) / (1000 * 60 * 60 * 24));

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
                    {isExpired && (
                      <div className="absolute top-[8px] left-[8px] bg-red-500 text-white text-[10px] font-[600] px-[8px] py-[2px] rounded-[4px]">
                        Expired
                      </div>
                    )}
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
                            className="w-[50px] h-[50px] rounded-[4px] object-contain bg-[#F6F6F6] p-[4px]"
                            loading="lazy"
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

            <Pagination
              currentPage={currentPage}
              totalPage={pagination?.totalPage || 1}
              totalRecord={pagination?.totalRecord || 0}
              skip={(currentPage - 1) * (pagination?.pageSize || 10)}
              currentCount={savedJobs.length}
              onPageChange={(page) => {
                setCurrentPage(page);
                replaceQuery({ page, keyword: activeKeyword });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
