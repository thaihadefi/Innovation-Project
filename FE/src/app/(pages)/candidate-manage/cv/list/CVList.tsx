"use client";
import { cvStatusList, positionList, workingFormList, paginationConfig } from "@/configs/variable";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaBriefcase, FaCircleCheck, FaUserTie, FaTriangleExclamation, FaShieldHalved, FaLocationDot } from "react-icons/fa6";
import { toast } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { useListQueryState } from "@/hooks/useListQueryState";
import { normalizeKeyword } from "@/utils/keyword";
import { ListSearchBar } from "@/app/components/common/ListSearchBar";

type CVListProps = {
  isVerified: boolean;
  initialCVList: any[];
  initialPagination?: {
    totalRecord: number;
    totalPage: number;
    currentPage: number;
    pageSize: number;
  } | null;
};

export const CVList = ({ isVerified, initialCVList, initialPagination = null }: CVListProps) => {
  const { queryKey, getPage, getKeyword, replaceQuery } = useListQueryState();
  const initialKeyword = getKeyword();

  const [cvList, setCVList] = useState<any[]>(initialCVList);
  const [searchTerm, setSearchTerm] = useState(initialKeyword);
  const [currentPage, setCurrentPage] = useState(initialPagination?.currentPage || 1);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; cvId: string; jobTitle: string }>({
    show: false,
    cvId: "",
    jobTitle: ""
  });
  const [deleting, setDeleting] = useState(false);
  const isFirstLoad = useRef(true);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchCVList = useCallback(async (page: number, keyword: string) => {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/list?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.code == "success") {
        setCVList(data.cvList || []);
        setPagination(data.pagination || null);
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Failed to fetch candidate CV list:", error);
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
    if (!isVerified) return;
    const pageFromUrl = getPage();
    const keywordFromUrl = getKeyword();
    setCurrentPage((prev) => (prev === pageFromUrl ? prev : pageFromUrl));
    setSearchTerm((prev) => (prev === keywordFromUrl ? prev : keywordFromUrl));
    if (isFirstLoad.current) {
      isFirstLoad.current = false;
      return;
    }
    fetchCVList(pageFromUrl, keywordFromUrl);
  }, [fetchCVList, getKeyword, getPage, isVerified, queryKey]);

  const applySearch = () => {
    if (!isVerified) return;
    const normalizedKeyword = normalizeKeyword(searchTerm);
    replaceQuery({ page: 1, keyword: normalizedKeyword.isValid ? normalizedKeyword.value : "" });
  };

  const activeKeyword = getKeyword();

  const openDeleteModal = (cvId: string, jobTitle: string) => {
    setDeleteModal({ show: true, cvId, jobTitle });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, cvId: "", jobTitle: "" });
  };

  const confirmDelete = () => {
    setDeleting(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/delete/${deleteModal.cvId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          toast.success(data.message);
          fetchCVList(currentPage, activeKeyword);
        } else {
          toast.error(data.message);
        }
        setDeleting(false);
        closeDeleteModal();
      })
      .catch(() => {
        toast.error("Failed to delete application");
        setDeleting(false);
        closeDeleteModal();
      });
  };

  return (
    <>
      {!isVerified && (
        <div className="mb-[24px] p-[20px] bg-amber-50 border border-amber-200 rounded-[8px]">
          <div className="flex items-start gap-[12px]">
            <FaShieldHalved className="text-[24px] text-amber-500 flex-shrink-0 mt-[2px]" />
            <div>
              <h3 className="font-[700] text-[16px] text-amber-700 mb-[4px]">Verify Your Student ID to Apply for Jobs</h3>
              <p className="text-[14px] text-amber-600 mb-[12px]">
                You need to verify your student ID before you can apply for jobs and view your applications.
              </p>
              <Link
                href="/candidate-manage/profile"
                className="inline-flex items-center gap-[8px] px-[16px] py-[8px] bg-amber-500 text-white rounded-[4px] font-[600] text-[14px] hover:bg-amber-600 transition-colors"
              >
                <FaShieldHalved />
                Verify Now
              </Link>
            </div>
          </div>
        </div>
      )}
      <div className="mb-[24px] p-[16px] bg-[#F5F7FF] border border-[#D6E0FF] rounded-[8px]">
        <div className="text-[14px] text-[#2B3A67]">
          Need help with your CV? See tips from Harvard Career Services.{" "}
          <Link
            href="https://careerservices.fas.harvard.edu/channels/create-a-resume-cv-or-cover-letter/"
            target="_blank"
            rel="noreferrer"
            className="font-[600] text-[#0088FF] hover:underline"
          >
            View guide →
          </Link>
        </div>
      </div>

      {isVerified && (
        <>
          <div className="mb-[20px] max-w-[520px]">
            <ListSearchBar
              value={searchTerm}
              placeholder="Search by job title or company..."
              onChange={setSearchTerm}
              onSubmit={applySearch}
              onClear={() => {
                setSearchTerm("");
                replaceQuery({ page: 1, keyword: "" });
              }}
              disabled={loading}
            />
          </div>

          {loading ? (
            <div className="text-center py-[40px] text-[#666]">Loading...</div>
          ) : (pagination?.totalRecord || 0) === 0 ? (
            <div className="text-center py-[40px] text-[#666]">
              {activeKeyword ? (
                <>
                  <p>No applications found for &quot;{activeKeyword}&quot;</p>
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
                  <p>You haven&apos;t submitted any applications yet.</p>
                  <Link href="/search" className="text-[#0088FF] hover:underline mt-[10px] inline-block">
                    Browse jobs and apply!
                  </Link>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
                {cvList.map((item) => {
                  const position = positionList.find(pos => pos.value == item.position);
                  const workingForm = workingFormList.find(work => work.value == item.workingForm);
                  const cvStatus = cvStatusList.find(stt => stt.value == item.status);

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
                          {item.jobTitle}
                        </h3>
                        <div className="text-center mb-[6px] text-[14px] font-[400]">
                          Company: <span className="font-[700]">{item.companyName}</span>
                        </div>
                        <div className="font-[600] text-[16px] mb-[6px] text-center text-[#0088FF]">
                          {item.salaryMin?.toLocaleString("vi-VN")} VND - {item.salaryMax?.toLocaleString("vi-VN")} VND
                        </div>
                        <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                          <FaUserTie className="text-[16px]" /> {position?.label}
                        </div>
                        <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                          <FaBriefcase className="text-[16px]" /> {workingForm?.label}
                        </div>
                        {item.jobLocations && item.jobLocations.length > 0 && (
                          <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                            <FaLocationDot className="text-[16px]" />
                            {item.jobLocations.slice(0, 3).join(", ") + (item.jobLocations.length > 3 ? "..." : "")}
                          </div>
                        )}
                        <div className="flex flex-wrap items-center justify-center gap-[8px] mb-[16px] px-[16px]">
                          {(item.skills || []).map((tech: string, idx: number) => (
                            <div
                              key={idx}
                              className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]"
                            >
                              {tech}
                            </div>
                          ))}
                        </div>
                        {item.appliedAt && (
                          <div className="text-center text-[12px] text-[#999] mb-[6px]">
                            Applied {(() => {
                              const diff = Date.now() - new Date(item.appliedAt).getTime();
                              const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                              if (days === 0) return "today";
                              if (days === 1) return "yesterday";
                              if (days < 7) return `${days} days ago`;
                              if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
                              return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
                            })()}
                          </div>
                        )}
                        <div
                          className="flex items-center justify-center gap-[8px] font-[400] text-[14px] mb-[16px]"
                          style={{
                            color: cvStatus?.color
                          }}
                        >
                          <FaCircleCheck className="text-[16px]" /> {cvStatus?.label}
                        </div>
                        {item.isExpired && (
                          <div className="text-center text-[12px] text-[#B54708] mb-[12px]">
                            {item.status === "initial" ? "Expired - editing disabled" : "Expired"}
                          </div>
                        )}
                        <div className="flex items-center justify-center gap-[12px] mb-[20px]">
                          <Link
                            href={`/candidate-manage/cv/view/${item.id}`}
                            className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                          >
                            View
                          </Link>
                          {item.status === "initial" && !item.isExpired && (
                            <Link
                              href={`/candidate-manage/cv/edit/${item.id}`}
                              className="bg-[#FFB200] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px] hover:bg-[#E6A000]"
                            >
                              Edit
                            </Link>
                          )}
                          <button
                            className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:bg-[#DD0000]"
                            onClick={() => openDeleteModal(item.id, item.jobTitle)}
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
                skip={(currentPage - 1) * (pagination?.pageSize || paginationConfig.candidateApplicationsList)}
            currentCount={cvList.length}
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
                  <h3 className="font-[700] text-[18px] text-[#121212] mb-[8px]">Delete Application?</h3>
                  <p className="text-[#666] text-[14px] mb-[20px]">
                    Are you sure you want to delete your application for{" "}
                    <span className="font-[600] text-[#121212]">&quot;{deleteModal.jobTitle}&quot;</span>?
                    <br />
                    <span className="text-[#DC2626]">This action cannot be undone.</span>
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
      )}
    </>
  );
};
