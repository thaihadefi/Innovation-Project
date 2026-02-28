"use client";
import { cvStatusList, positionList, workingFormList, paginationConfig } from "@/configs/variable";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { FaBriefcase, FaCircleCheck, FaEnvelope, FaPhone, FaUserTie, FaTriangleExclamation } from "react-icons/fa6";
import { toast } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { useListQueryState } from "@/hooks/useListQueryState";
import { normalizeKeyword } from "@/utils/keyword";
import { ListSearchBar } from "@/app/components/common/ListSearchBar";

type CVListProps = {
  initialCVList: any[];
  initialPagination?: {
    totalRecord: number;
    totalPage: number;
    currentPage: number;
    pageSize: number;
  } | null;
};

export const CVList = ({ initialCVList, initialPagination = null }: CVListProps) => {
  const { queryKey, getPage, getKeyword, replaceQuery } = useListQueryState();
  const initialKeyword = getKeyword();

  const [cvList, setCVList] = useState<any[]>(initialCVList);
  const [searchTerm, setSearchTerm] = useState(initialKeyword);
  const [currentPage, setCurrentPage] = useState(initialPagination?.currentPage || 1);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [keywordError, setKeywordError] = useState("");
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string; name: string }>({
    show: false,
    id: "",
    name: ""
  });
  const [deleting, setDeleting] = useState(false);
  const isFirstLoad = useRef(true);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchCVs = useCallback(async (page: number, keyword: string) => {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/cv/list?${params.toString()}`, {
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.code == "success") {
        setCVList(data.cvList || []);
        setPagination(data.pagination || null);
      } else {
        setErrorMessage("Unable to load applications. Please try again.");
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Failed to fetch company CV list:", error);
        setErrorMessage("Unable to load applications. Please try again.");
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
    fetchCVs(pageFromUrl, keywordFromUrl);
  }, [fetchCVs, getKeyword, getPage, queryKey]);

  const applySearch = () => {
    const normalizedKeyword = normalizeKeyword(searchTerm);
    if (!normalizedKeyword.isValid) {
      setKeywordError("Please enter at least 1 alphanumeric character.");
      return;
    }
    setKeywordError("");
    replaceQuery({ page: 1, keyword: normalizedKeyword.value });
  };

  const activeKeyword = getKeyword();

  const handleChangeStatus = (id: string, status: string) => {
    // Optimistic update — update UI immediately without re-fetching
    const previousList = cvList;
    setCVList(prev => prev.map(item => item.id === id ? { ...item, status } : item));

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/cv/change-status/${id}`, {
      method: "PATCH",
      credentials: "include",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ status })
    })
      .then(res => res.json())
      .then(data => {
        if (data.code == "success") {
          toast.success(data.message);
        } else {
          // Revert on failure
          setCVList(previousList);
          toast.error(data.message || "Unable to update application status. Please try again.");
        }
      })
      .catch(() => {
        setCVList(previousList);
        toast.error("Unable to update application status. Please try again.");
      });
  };

  const openDeleteModal = (id: string, name: string) => {
    setDeleteModal({ show: true, id, name });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, id: "", name: "" });
  };

  const confirmDelete = () => {
    setDeleting(true);
    // Optimistic delete — remove from UI immediately
    const previousList = cvList;
    const previousPagination = pagination;
    setCVList(prev => prev.filter(item => item.id !== deleteModal.id));
    if (pagination) {
      setPagination({ ...pagination, totalRecord: Math.max(0, pagination.totalRecord - 1) });
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/cv/delete/${deleteModal.id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code == "success") {
          toast.success(data.message);
        } else {
          // Revert on failure
          setCVList(previousList);
          setPagination(previousPagination);
          toast.error(data.message);
        }
        setDeleting(false);
        closeDeleteModal();
      })
      .catch(() => {
        setCVList(previousList);
        setPagination(previousPagination);
        toast.error("Unable to delete application. Please try again.");
        setDeleting(false);
        closeDeleteModal();
      });
  };

  return (
    <>
      <div className="mb-[20px]">
        <div className="max-w-[560px]">
          <ListSearchBar
            value={searchTerm}
            placeholder="Search by job title, candidate name, or email..."
            onChange={(value) => { setSearchTerm(value); if (keywordError) setKeywordError(""); }}
            onSubmit={applySearch}
            onClear={() => {
              setSearchTerm("");
              setKeywordError("");
              replaceQuery({ page: 1, keyword: "" });
            }}
            disabled={loading}
          />
          {keywordError && (
            <div className="mt-[8px] flex items-center gap-[8px] text-[14px] text-[#C98900]">
              <FaTriangleExclamation className="text-[14px]" aria-hidden="true" />
              <span>{keywordError}</span>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-[40px] text-[#666]">Loading...</div>
      ) : errorMessage ? (
        <div className="text-center py-[40px] text-[#666]">
          <p className="mb-[12px]">{errorMessage}</p>
          <button
            type="button"
            onClick={() => fetchCVs(currentPage, activeKeyword)}
            className="inline-block rounded-[8px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] px-[18px] py-[10px] text-[14px] font-[600] text-white hover:from-[#0077EE] hover:to-[#0055BB]"
          >
            Retry
          </button>
        </div>
      ) : (pagination?.totalRecord || 0) === 0 ? (
        <div className="rounded-[12px] border border-[#E8ECF3] bg-white px-[20px] py-[56px] text-center shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
          <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F2F7FF] text-[#0088FF]">
            <FaBriefcase className="text-[30px]" />
          </div>
          <h3 className="mb-[8px] font-[700] text-[26px] leading-[1.2] text-[#0F172A]">
            No applications found
          </h3>
          <p className="mx-auto max-w-[620px] text-[16px] leading-[1.6] text-[#64748B]">
            {activeKeyword ? "Try adjusting your search filters." : "No applications received yet."}
          </p>
          {activeKeyword && (
            <div className="mt-[22px] flex flex-wrap items-center justify-center gap-[10px]">
              <button
                onClick={() => {
                  setSearchTerm("");
                  replaceQuery({ page: 1, keyword: "" });
                }}
                className="h-[42px] rounded-[10px] border border-[#D7E3F7] bg-white px-[16px] text-[14px] font-[600] text-[#334155] transition hover:border-[#0088FF] hover:text-[#0B60D1]"
              >
                Clear search
              </button>
            </div>
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
                      Candidate: <span className="font-[700]">{item.fullName}</span>
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaEnvelope className="text-[16px]" /> {item.email}
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[12px]">
                      <FaPhone className="text-[16px]" /> {item.phone}
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
                    <div
                      className="flex items-center justify-center gap-[8px] font-[600] text-[14px] mb-[12px]"
                      style={{ color: cvStatus?.color }}
                    >
                      <FaCircleCheck className="text-[16px]" /> {cvStatus?.label}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-[8px] mb-[20px] px-[16px]">
                      <Link
                        href={`/company-manage/cv/detail/${item.id}`}
                        className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                      >
                        View
                      </Link>
                      {cvStatus?.value != "approved" && (
                        <button
                          className="bg-[#9FDB7C] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px] cursor-pointer hover:bg-[#8FC96C]"
                          onClick={() => handleChangeStatus(item.id, "approved")}
                        >
                          Approve
                        </button>
                      )}
                      {cvStatus?.value != "rejected" && (
                        <button
                          className="bg-[#FF5100] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] cursor-pointer hover:bg-[#E64900]"
                          onClick={() => handleChangeStatus(item.id, "rejected")}
                        >
                          Reject
                        </button>
                      )}
                      <button
                        className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] cursor-pointer hover:bg-[#DD0000]"
                        onClick={() => openDeleteModal(item.id, item.fullName)}
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
            skip={(currentPage - 1) * (pagination?.pageSize || paginationConfig.companyCVList)}
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
                Are you sure you want to delete the application from{" "}
                <span className="font-[600] text-[#121212]">&quot;{deleteModal.name}&quot;</span>?
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
  );
};
