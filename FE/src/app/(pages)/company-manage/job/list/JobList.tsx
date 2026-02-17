"use client";
import { positionList, workingFormList, paginationConfig } from "@/configs/variable";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaBriefcase, FaUserTie, FaTriangleExclamation, FaLocationDot } from "react-icons/fa6";
import { toast } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { useListQueryState } from "@/hooks/useListQueryState";
import { normalizeKeyword } from "@/utils/keyword";
import { ListSearchBar } from "@/app/components/common/ListSearchBar";

const MUTATION_KEY = "job_data_mutated_at";

type JobListProps = {
  initialJobList: any[];
  initialPagination?: {
    totalRecord: number;
    totalPage: number;
    currentPage: number;
    pageSize: number;
  } | null;
};

export const JobList = ({ initialJobList, initialPagination = null }: JobListProps) => {
  const { queryKey, getPage, getKeyword, replaceQuery } = useListQueryState();
  const initialKeyword = getKeyword();

  const [jobList, setJobList] = useState<any[]>(initialJobList);
  const [searchTerm, setSearchTerm] = useState(initialKeyword);
  const [currentPage, setCurrentPage] = useState(initialPagination?.currentPage || 1);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string; title: string }>({
    show: false,
    id: "",
    title: ""
  });
  const [deleting, setDeleting] = useState(false);
  const isFirstLoad = useRef(true);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchJobs = useCallback(async (page: number, keyword: string) => {
    fetchAbortRef.current?.abort();
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoading(true);
    setErrorMessage("");
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      const normalizedKeyword = normalizeKeyword(keyword);
      if (normalizedKeyword.isValid && normalizedKeyword.value) {
        params.set("keyword", normalizedKeyword.value);
      }
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/job/list?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.code === "success") {
        setJobList(data.jobList || []);
        setPagination({
          totalRecord: data.totalRecord || 0,
          totalPage: data.totalPage || 1,
          currentPage: data.currentPage || page,
          pageSize: data.pageSize || paginationConfig.companyJobList
        });
      } else {
        setErrorMessage("Unable to load jobs. Please try again.");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Failed to fetch company jobs:", error);
        setErrorMessage("Unable to load jobs. Please try again.");
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
    setSearchTerm((prev) => (prev === keywordFromUrl ? prev : keywordFromUrl));
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    fetchJobs(pageFromUrl, keywordFromUrl);
  }, [fetchJobs, getKeyword, getPage, queryKey]);

  const applySearch = () => {
    const normalizedKeyword = normalizeKeyword(searchTerm);
    replaceQuery({ page: 1, keyword: normalizedKeyword.isValid ? normalizedKeyword.value : "" });
  };

  const activeKeyword = getKeyword();

  const openDeleteModal = (id: string, title: string) => {
    setDeleteModal({ show: true, id, title });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, id: "", title: "" });
  };

  const confirmDelete = () => {
    setDeleting(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/job/delete/${deleteModal.id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code == "success") {
          toast.success(data.message);
          if (typeof window !== "undefined") {
            localStorage.setItem(MUTATION_KEY, String(Date.now()));
          }
          fetchJobs(currentPage, activeKeyword);
        } else {
          toast.error(data.message);
        }
        setDeleting(false);
        closeDeleteModal();
      })
      .catch(() => {
        toast.error("Unable to delete job. Please try again.");
        setDeleting(false);
        closeDeleteModal();
      });
  };

  return (
    <>
      <div className="mb-[20px]">
        <ListSearchBar
          value={searchTerm}
          placeholder="Search by job title..."
          onChange={setSearchTerm}
          onSubmit={applySearch}
          onClear={() => {
            setSearchTerm("");
            replaceQuery({ page: 1, keyword: "" });
          }}
          className="max-w-[520px]"
        />
      </div>

      {loading ? (
        <div className="text-center py-[40px] text-[#666]">Loading...</div>
      ) : errorMessage ? (
        <div className="text-center py-[40px] text-[#666]">
          <p className="mb-[12px]">{errorMessage}</p>
          <button
            type="button"
            onClick={() => fetchJobs(currentPage, activeKeyword)}
            className="inline-block rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] px-[18px] py-[10px] text-[14px] font-[600] text-white hover:from-[#0077EE] hover:to-[#0055BB]"
          >
            Retry
          </button>
        </div>
      ) : (pagination?.totalRecord || 0) === 0 ? (
        <div className="text-center py-[40px] text-[#666]">
          {activeKeyword ? (
            <>
              <p>No jobs found for &quot;{activeKeyword}&quot;</p>
              <button
                onClick={() => {
                  setSearchTerm("");
                  replaceQuery({ page: 1, keyword: "" });
                }}
                className="text-[#0088FF] hover:underline mt-[10px] inline-block"
              >
                Clear search
              </button>
            </>
          ) : (
            <>
              <p>You haven&apos;t created any jobs yet.</p>
              <Link href="/company-manage/job/create" className="text-[#0088FF] hover:underline mt-[10px] inline-block">
                Create your first job posting!
              </Link>
            </>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
            {jobList.map(item => {
              const position = positionList.find(pos => pos.value == item.position);
              const workingForm = workingFormList.find(work => work.value == item.workingForm);

              return (
                <div
                  key={item.id}
                  className="rounded-[8px] border border-[#DEDEDE] relative"
                  style={{
                    backgroundImage: "url('/assets/images/card-bg.svg'), linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)",
                    backgroundRepeat: "no-repeat, no-repeat",
                    backgroundSize: "100% auto, cover",
                    backgroundPosition: "top left, center"
                  }}
                >
                  <div className="relative">
                    <h3 className="pt-[20px] mx-[16px] mb-[6px] font-[700] text-[14px] sm:text-[18px] text-[#121212] text-center line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="font-[600] text-[16px] mb-[6px] text-center text-[#0088FF]">
                      {item.salaryMin?.toLocaleString("vi-VN")} VND - {item.salaryMax?.toLocaleString("vi-VN")} VND
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaUserTie className="text-[16px]" /> {position?.label}
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaBriefcase className="text-[16px]" /> {workingForm?.label}
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaLocationDot className="text-[16px]" />
                      {item.jobLocations && item.jobLocations.length > 0
                        ? item.jobLocations.slice(0, paginationConfig.maxDisplayedJobLocations).join(", ") + (item.jobLocations.length > paginationConfig.maxDisplayedJobLocations ? "..." : "")
                        : "No location set"}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-[8px] mb-[20px]">
                      {(item.skillSlugs || []).map((itemSkill: string, indexSkill: number) => (
                        <div
                          key={indexSkill}
                          className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]"
                        >
                          {itemSkill}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-[16px] mb-[16px] text-[12px]">
                      <div className="text-center">
                        <div className="font-[600] text-[#0088FF]">
                          {item.applicationCount || 0}/{item.maxApplications || "∞"}
                        </div>
                        <div className="text-[#666]">Applications</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-[600] ${(item.maxApproved > 0 && item.approvedCount >= item.maxApproved) ? "text-red-500" : "text-green-600"}`}>
                          {item.approvedCount || 0}/{item.maxApproved || "∞"}
                        </div>
                        <div className="text-[#666]">Approved</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-[12px] mb-[20px]">
                      <Link
                        href={`/job/detail/${item.slug}`}
                        className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                      >
                        View
                      </Link>
                      <Link
                        href={`/company-manage/job/edit/${item.id}`}
                        className="bg-[#FFB200] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px] hover:bg-[#E6A000]"
                      >
                        Edit
                      </Link>
                      <button
                        className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:bg-[#DD0000]"
                        onClick={() => openDeleteModal(item.id, item.title)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            currentPage={currentPage}
            totalPage={pagination?.totalPage || 1}
            totalRecord={pagination?.totalRecord || 0}
            skip={(currentPage - 1) * (pagination?.pageSize || paginationConfig.companyJobList)}
            currentCount={jobList.length}
              onPageChange={(page) => {
                setCurrentPage(page);
                replaceQuery({ page, keyword: activeKeyword });
              }}
            />
        </>
      )}

      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-[12px] p-[24px] max-w-[400px] w-[90%] shadow-xl">
            <div className="text-center">
              <div className="w-[60px] h-[60px] mx-auto mb-[16px] rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <FaTriangleExclamation className="text-[28px] text-[#DC2626]" />
              </div>
              <h3 className="font-[700] text-[18px] text-[#121212] mb-[8px]">Delete Job?</h3>
              <p className="text-[#666] text-[14px] mb-[20px]">
                Are you sure you want to delete{" "}
                <span className="font-[600] text-[#121212]">&quot;{deleteModal.title}&quot;</span>?
                <br />
                <span className="text-[#DC2626]">This will also delete all applications for this job.</span>
              </p>
              <div className="flex gap-[12px]">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="flex-1 h-[44px] rounded-[8px] border border-[#DEDEDE] font-[600] text-[14px] text-[#666] hover:bg-[#F5F5F5] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 h-[44px] rounded-[8px] bg-[#DC2626] font-[600] text-[14px] text-white hover:bg-[#B91C1C] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
