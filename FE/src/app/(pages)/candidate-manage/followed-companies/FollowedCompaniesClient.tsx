"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FaBuilding, FaXmark } from "react-icons/fa6";
import { toast, Toaster } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { useListQueryState } from "@/hooks/useListQueryState";
import { normalizeKeyword } from "@/utils/keyword";
import { ListSearchBar } from "@/app/components/common/ListSearchBar";

type FollowedCompaniesClientProps = {
  initialCompanies: any[];
  initialPagination?: {
    totalRecord: number;
    totalPage: number;
    currentPage: number;
    pageSize: number;
  } | null;
};

export const FollowedCompaniesClient = ({ initialCompanies, initialPagination = null }: FollowedCompaniesClientProps) => {
  const { queryKey, getPage, getKeyword, replaceQuery } = useListQueryState();
  const initialKeyword = getKeyword();

  const [companies, setCompanies] = useState<any[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState(initialKeyword);
  const [currentPage, setCurrentPage] = useState(initialPagination?.currentPage || 1);
  const [pagination, setPagination] = useState(initialPagination);
  const [loading, setLoading] = useState(false);
  const isFirstLoad = useRef(true);
  const fetchAbortRef = useRef<AbortController | null>(null);

  const fetchCompanies = useCallback(async (page: number, keyword: string) => {
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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/followed-companies?${params.toString()}`, {
          method: "GET",
          credentials: "include",
          cache: "no-store",
          signal: controller.signal,
        });
      const data = await res.json();
      if (controller.signal.aborted) return;
      if (data.code === "success") {
        setCompanies(data.companies || []);
        setPagination(data.pagination || null);
      }
    } catch (error: any) {
      if (error?.name !== "AbortError") {
        console.error("Failed to fetch followed companies:", error);
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
    fetchCompanies(pageFromUrl, keywordFromUrl);
  }, [fetchCompanies, getKeyword, getPage, queryKey]);

  const applySearch = () => {
    const normalizedKeyword = normalizeKeyword(searchQuery);
    replaceQuery({ page: 1, keyword: normalizedKeyword.isValid ? normalizedKeyword.value : "" });
  };

  const handleUnfollow = (companyId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/follow/${companyId}`, {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success" && !data.following) {
          fetchCompanies(currentPage, getKeyword());
          toast.success("Unfollowed successfully.");
        }
      });
  };

  const activeKeyword = getKeyword();

  return (
    <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
      <Toaster richColors position="top-right" />
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
          <h1 className="font-[700] text-[24px] text-[#121212]">
            Followed Companies ({pagination?.totalRecord || 0})
          </h1>

          <div className="w-full md:w-[460px]">
            <ListSearchBar
              value={searchQuery}
              placeholder="Search by company name..."
              onChange={setSearchQuery}
              onSubmit={applySearch}
              onClear={() => {
                setSearchQuery("");
                replaceQuery({ page: 1, keyword: "" });
              }}
              disabled={loading}
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-[40px] text-[#666]">Loading...</div>
        ) : companies.length === 0 ? (
          <div className="text-center py-[40px]">
            <FaBuilding className="text-[48px] text-[#ccc] mx-auto mb-[16px]" />
            <p className="text-[#666] mb-[16px]">
              {activeKeyword ? "No companies found." : "You haven't followed any companies yet."}
            </p>
            {!activeKeyword && (
              <Link
                href="/company/list"
                className="inline-block bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[24px] py-[12px] rounded-[8px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Browse Companies
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
              {companies.map((company) => (
                <div
                  key={company._id}
                  className="border border-[#DEDEDE] rounded-[8px] p-[16px] flex items-center gap-[12px] relative group hover:border-[#0088FF] transition-colors"
                >
                  <Link href={`/company/detail/${company.slug}`} className="flex-shrink-0">
                    {company.logo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={company.logo}
                        alt={company.companyName || "Logo"}
                        width={50}
                        height={50}
                        className="w-[50px] h-[50px] rounded-[4px] object-contain bg-[#F6F6F6] p-[4px]"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] rounded-[4px] bg-gray-200 flex items-center justify-center">
                        <FaBuilding className="text-[20px] text-gray-400" />
                      </div>
                    )}
                  </Link>
                  <Link href={`/company/detail/${company.slug}`} className="flex-1 min-w-0">
                    <h3 className="font-[600] text-[15px] text-[#121212] hover:text-[#0088FF] truncate">
                      {company.companyName}
                    </h3>
                  </Link>
                  <button
                    onClick={() => handleUnfollow(company._id)}
                    className="p-[8px] rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    title="Unfollow"
                  >
                    <FaXmark className="text-[14px]" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPage={pagination?.totalPage || 1}
              totalRecord={pagination?.totalRecord || 0}
              skip={(currentPage - 1) * (pagination?.pageSize || 9)}
              currentCount={companies.length}
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
