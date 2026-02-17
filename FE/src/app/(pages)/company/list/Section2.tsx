"use client";
import { CardCompanyItem } from "@/app/components/card/CardCompanyItem";
import { CardSkeletonGrid } from "@/app/components/ui/CardSkeleton";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";
import { paginationConfig } from "@/configs/variable";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaBuilding } from "react-icons/fa";
import { normalizeKeyword } from "@/utils/keyword";
import { ListSearchBar } from "@/app/components/common/ListSearchBar";

type Section2Props = {
  initialCompanies?: any[];
  initialTotalPage?: number;
  initialTotalRecord?: number;
  initialLocations?: any[];
};

export const Section2 = ({
  initialCompanies = [],
  initialTotalPage = 0,
  initialTotalRecord = 0,
  initialLocations = []
}: Section2Props) => {
  const COMPANY_SEARCH_CACHE_TTL_MS = 30_000;
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const location = searchParams.get("location") || "";
  const pageFromQuery = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [companyList, setCompanyList] = useState<any[]>(initialCompanies);
  const [page, setPage] = useState(pageFromQuery);
  const [totalPage, setTotalPage] = useState(initialTotalPage);
  const [totalRecord, setTotalRecord] = useState(initialTotalRecord);
  const [locationList, setLocationList] = useState<any[]>(initialLocations);
  const [loading, setLoading] = useState(initialCompanies.length === 0);
  const [keywordInput, setKeywordInput] = useState(keyword);
  const [locationInput, setLocationInput] = useState(location);
  const [appliedKeyword, setAppliedKeyword] = useState(keyword);
  const [appliedLocation, setAppliedLocation] = useState(location);
  const [showLoadingHint, setShowLoadingHint] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  
  // Track if this is the first mount with server data
  const isFirstMount = useRef(true);
  const hasInitialData = useRef(initialCompanies.length > 0);
  const latestCompanyRequestIdRef = useRef(0);
  const companySearchCacheRef = useRef<Map<string, any>>(new Map());

  // Fetch locations for filter - only if not provided
  useEffect(() => {
    if (initialLocations.length > 0) return;
    const controller = new AbortController();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/location`, {
      method: "GET",
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (controller.signal.aborted) return;
        if(data.code === "success") {
          setLocationList(sortLocationsWithOthersLast(data.locationList));
        }
      })
      .catch((error: any) => {
        if (error?.name === "AbortError") return;
        // ignore
      });
    return () => controller.abort();
  }, [initialLocations]);

  useEffect(() => {
    setKeywordInput(keyword);
    setLocationInput(location);
    setAppliedKeyword(keyword);
    setAppliedLocation(location);
    setPage(pageFromQuery);
  }, [keyword, location, pageFromQuery]);

  // Fetch companies based on local filters
  useEffect(() => {
    // Skip initial fetch if we have server data
    if (isFirstMount.current && hasInitialData.current) {
      isFirstMount.current = false;
      return;
    }
    
    const params = new URLSearchParams();
    params.set("limitItems", String(paginationConfig.companyList));
    params.set("page", String(page));
    const normalizedKeyword = normalizeKeyword(appliedKeyword);
    if (normalizedKeyword.isValid && normalizedKeyword.value) {
      params.set("keyword", normalizedKeyword.value);
    }
    if (appliedLocation) params.set("location", appliedLocation);
    const url = `${process.env.NEXT_PUBLIC_API_URL}/company/list?${params.toString()}`;

    const cached = companySearchCacheRef.current.get(url);
    if (cached && Date.now() - cached.ts < COMPANY_SEARCH_CACHE_TTL_MS) {
      const data = cached.data;
      setCompanyList(data.companyList || []);
      setTotalPage(data.totalPage || 0);
      setTotalRecord(data.totalRecord || 0);
      setLoading(false);
      setErrorMessage("");
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;
    const requestId = ++latestCompanyRequestIdRef.current;
    setLoading(true);
    setErrorMessage("");
    fetch(url, {
      signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (signal.aborted || requestId !== latestCompanyRequestIdRef.current) return;
        if(data.code == "success") {
          companySearchCacheRef.current.set(url, { ts: Date.now(), data });
          setCompanyList(data.companyList);
          setTotalPage(data.totalPage);
          setTotalRecord(data.totalRecord || 0);
          setErrorMessage("");
        } else {
          setErrorMessage("Unable to load companies. Please try again.");
        }
      })
      .catch(err => {
        if (err?.name !== "AbortError" && requestId === latestCompanyRequestIdRef.current) {
          console.error('Company list fetch failed:', err);
          setErrorMessage("Unable to load companies. Please try again.");
        }
      })
      .finally(() => {
        if (!signal.aborted && requestId === latestCompanyRequestIdRef.current) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [page, appliedKeyword, appliedLocation, reloadKey]);

  // Delay loading hint slightly to avoid flicker on quick responses.
  useEffect(() => {
    if (!loading) {
      setShowLoadingHint(false);
      return;
    }
    const timer = setTimeout(() => setShowLoadingHint(true), 150);
    return () => clearTimeout(timer);
  }, [loading]);

  const handlePagination = (event: any) => {
    const value = event.target.value;
    setPage(parseInt(value));
  }

  const handleKeywordChange = (value: string) => {
    setKeywordInput(value);
  }

  const handleLocationChange = (event: any) => {
    const locationValue = event.target.value;
    setLocationInput(locationValue);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    const normalizedKeyword = normalizeKeyword(appliedKeyword);
    if (normalizedKeyword.isValid && normalizedKeyword.value) {
      params.set("keyword", normalizedKeyword.value);
    }
    if (appliedLocation) params.set("location", appliedLocation);
    if (page > 1) params.set("page", String(page));
    const target = `/company/list${params.toString() ? `?${params.toString()}` : ""}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (current !== target) {
      window.history.replaceState(null, "", target);
    }
  }, [appliedKeyword, appliedLocation, page]);

  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <h2 className="text-center font-[700] text-[24px] sm:text-[28px] text-[#121212] mb-[30px]">
            Company List
          </h2>

          {/* Search Form */}
          <div
            className="mb-[30px] rounded-[8px] bg-white py-[20px] px-[20px]"
            style={{
              boxShadow: "0px 4px 20px 0px #0000000F"
            }}
          >
            <div className="flex flex-wrap gap-[12px]">
              <select 
                name="location"
                className="w-[240px] h-[44px] border border-[#DEDEDE] rounded-[4px] px-[18px] font-[400] text-[16px] text-[#414042]"
                value={locationInput}
                onChange={handleLocationChange}
              >
                <option value="">All Locations</option>
                {locationList.map((item: any) => (
                  <option key={item._id} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
              <div className="flex-1 min-w-[280px]">
                <ListSearchBar
                  value={keywordInput}
                  placeholder="Search by company name..."
                  onChange={handleKeywordChange}
                  onSubmit={() => {
                    const normalizedKeyword = normalizeKeyword(keywordInput);
                    setAppliedKeyword(normalizedKeyword.isValid ? normalizedKeyword.value : "");
                    setAppliedLocation(locationInput);
                    setPage(1);
                  }}
                  onClear={() => {
                    setKeywordInput("");
                    setAppliedKeyword("");
                    setAppliedLocation(locationInput);
                    setPage(1);
                  }}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
          {/* End Search Form */}
          {showLoadingHint && (
            <div
              className="mb-[16px] inline-flex items-center gap-[8px] text-[14px] font-[600] text-[#0B60D1]"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="inline-block h-[14px] w-[14px] rounded-full border-2 border-[#0B60D1]/30 border-t-[#0B60D1] animate-spin" />
              {companyList.length > 0 ? "Updating results..." : "Searching..."}
            </div>
          )}

          {/* Company List or No Results */}
          {loading ? (
            <CardSkeletonGrid count={6} type="company" />
          ) : errorMessage ? (
            <div className="rounded-[12px] border border-[#E8ECF3] bg-white px-[20px] py-[56px] text-center shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
              <p className="mb-[12px] text-[16px] text-[#64748B]">{errorMessage}</p>
              <button
                type="button"
                onClick={() => {
                  const normalizedKeyword = normalizeKeyword(keywordInput);
                  setAppliedKeyword(normalizedKeyword.isValid ? normalizedKeyword.value : "");
                  setAppliedLocation(locationInput);
                  setReloadKey((prev) => prev + 1);
                }}
                className="h-[42px] rounded-[10px] bg-[#0088FF] px-[16px] text-[14px] font-[700] text-white transition hover:bg-[#0B60D1]"
              >
                Retry
              </button>
            </div>
          ) : companyList.length > 0 ? (
            <>
              {/* Results Count */}
              <div className="flex items-center gap-[8px] mb-[20px] text-[14px] text-[#666]">
                <FaBuilding className="text-[#0088FF]" />
                <span>Found <span className="font-[600] text-[#121212]">{totalRecord}</span> {totalRecord === 1 ? 'company' : 'companies'}</span>
              </div>
              
              {/* Wrap */}
              <div className="grid grid-cols-1 gap-x-[10px] gap-y-[20px] sm:grid-cols-2 sm:gap-x-[20px] lg:grid-cols-3">
                {/* Item */}
                {companyList.map((item, index) => (
                  <CardCompanyItem
                    key={item._id || `company-${index}`}
                    item={item}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPage > 1 && (
                <div className="mt-[30px]">
                  <select 
                    className="rounded-[8px] bg-white border border-[#DEDEDE] py-[12px] px-[18px] font-[400] text-[16px] text-[#414042]"
                    onChange={handlePagination}
                    value={page}
                  >
                    {Array(totalPage).fill("").map((_, index) => (
                      <option key={index} value={index+1}>
                        Page {index+1}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-[60px] bg-[#F5F5F5] rounded-[8px]">
              <div className="text-[48px] mb-[16px] text-[#666] flex justify-center"><FaBuilding /></div>
              <h3 className="font-[700] text-[20px] text-[#121212] mb-[8px]">
                No companies found
              </h3>
              <p className="text-[#666] text-[14px]">
                Try adjusting your search filters or browse all companies
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
