"use client";
import { CardCompanyItem } from "@/app/components/card/CardCompanyItem";
import { CardSkeletonGrid } from "@/app/components/ui/CardSkeleton";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";
import { paginationConfig } from "@/configs/variable";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaBuilding } from "react-icons/fa";
import { normalizeKeyword } from "@/utils/keyword";

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
  
  // Track if this is the first mount with server data
  const isFirstMount = useRef(true);
  const hasInitialData = useRef(initialCompanies.length > 0);

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

    const controller = new AbortController();
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/list?${params.toString()}`, {
      signal: controller.signal,
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if (controller.signal.aborted) return;
        if(data.code == "success") {
          setCompanyList(data.companyList);
          setTotalPage(data.totalPage);
          setTotalRecord(data.totalRecord || 0);
        }
        setLoading(false);
      })
      .catch(err => {
        if (err?.name !== "AbortError") {
          console.error('Company list fetch failed:', err);
        }
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [page, appliedKeyword, appliedLocation]);

  const handlePagination = (event: any) => {
    const value = event.target.value;
    setPage(parseInt(value));
  }

  const handleSearch = (event: any) => {
    event.preventDefault();
    const normalizedKeyword = normalizeKeyword(keywordInput);
    setAppliedKeyword(normalizedKeyword.isValid ? normalizedKeyword.value : "");
    setAppliedLocation(locationInput);
    setPage(1);
  }

  const handleKeywordChange = (event: any) => {
    setKeywordInput(event.target.value);
  }

  const handleLocationChange = (event: any) => {
    const locationValue = event.target.value;
    if (locationValue === appliedLocation) {
      setLocationInput(locationValue);
      return;
    }
    setLocationInput(locationValue);
    setAppliedLocation(locationValue);
    setPage(1);
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
          <form 
            onSubmit={handleSearch}
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
              <input 
                type="text"
                name="keyword"
                placeholder="Search company name..."
                className="flex-1 h-[44px] border border-[#DEDEDE] rounded-[4px] px-[18px] font-[400] text-[16px] text-[#414042]"
                value={keywordInput}
                onChange={handleKeywordChange}
              />
              <button 
                type="submit"
                className="w-[140px] h-[44px] bg-gradient-to-r from-[#0088FF] to-[#0066CC] rounded-[8px] inline-flex items-center justify-center gap-x-[10px] font-[500] text-[16px] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                <FaMagnifyingGlass /> Search
              </button>
            </div>
          </form>
          {/* End Search Form */}

          {/* Company List or No Results */}
          {loading ? (
            <CardSkeletonGrid count={6} type="company" />
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
