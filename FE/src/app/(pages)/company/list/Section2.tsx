/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { CardCompanyItem } from "@/app/components/card/CardCompanyItem";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { FaMagnifyingGlass } from "react-icons/fa6";

export const Section2 = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const keyword = searchParams.get("keyword") || "";
  const city = searchParams.get("city") || "";

  const [companyList, setCompanyList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(0);
  const [cityList, setCityList] = useState<any[]>([]);

  // Fetch cities for filter
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/city`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
        if(data.code === "success") {
          const sorted = data.cityList.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
          setCityList(sorted);
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  // Fetch companies (URL params are already debounced via handleKeywordChange)
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/list?limitItems=20&page=${page}&keyword=${keyword}&city=${city}`)
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if(data.code == "success") {
          setCompanyList(data.companyList);
          setTotalPage(data.totalPage);
        }
      })
      .catch(err => {
        console.error('Company list fetch failed:', err);
      });
  }, [page, keyword, city]);

  const handlePagination = (event: any) => {
    const value = event.target.value;
    setPage(parseInt(value));
  }

  const handleSearch = (event: any) => {
    event.preventDefault();
    const keyword = event.target.keyword.value;
    const city = event.target.city.value;
    updateURL(keyword, city);
  }

  // Debounce timer ref for keyword input
  const keywordDebounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleKeywordChange = (event: any) => {
    const keywordValue = event.target.value;
    
    // Debounce URL update for keyword (300ms)
    if (keywordDebounceRef.current) {
      clearTimeout(keywordDebounceRef.current);
    }
    keywordDebounceRef.current = setTimeout(() => {
      updateURL(keywordValue, city);
    }, 300);
  }

  const handleCityChange = (event: any) => {
    const cityValue = event.target.value;
    // City change updates URL immediately
    updateURL(keyword, cityValue);
  }

  const updateURL = (keywordValue: string, cityValue: string) => {
    const params = new URLSearchParams();
    if(keywordValue) params.set("keyword", keywordValue);
    if(cityValue) params.set("city", cityValue);
    router.push(`/company/list${params.toString() ? '?' + params.toString() : ''}`);
    setPage(1); // Reset to page 1 when searching
  }

  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <h2 className="text-center font-[700] sm:text-[28px] text-[24px] text-[#121212] mb-[30px]">
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
                name="city"
                className="w-[240px] h-[44px] border border-[#DEDEDE] rounded-[4px] px-[18px] font-[400] text-[16px] text-[#414042]"
                value={city}
                onChange={handleCityChange}
              >
                <option value="">All Cities</option>
                {cityList.map((item: any) => (
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
                value={keyword}
                onChange={handleKeywordChange}
              />
              <button 
                type="submit"
                className="w-[140px] h-[44px] bg-[#0088FF] rounded-[4px] inline-flex items-center justify-center gap-x-[10px] font-[500] text-[16px] text-white hover:bg-[#0077DD]"
              >
                <FaMagnifyingGlass /> Search
              </button>
            </div>
          </form>
          {/* End Search Form */}

          {/* Company List or No Results */}
          {companyList.length > 0 ? (
            <>
              {/* Wrap */}
              <div className="grid lg:grid-cols-3 grid-cols-2 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
                {/* Item */}
                {companyList.map(item => (
                  <CardCompanyItem
                    key={item.id}
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
              <div className="text-[48px] mb-[16px]">🏢</div>
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