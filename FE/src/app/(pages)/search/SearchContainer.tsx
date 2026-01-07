/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { Section1 } from "@/app/components/section/Section1";
import { positionList, workingFormList, paginationConfig } from "@/configs/variable";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Pagination } from "@/app/components/pagination/Pagination";
import { JobCardSkeleton } from "@/app/components/ui/CardSkeleton";
import { NumberSkeleton } from "@/app/components/ui/Skeleton";
import { FaSearch } from "react-icons/fa";

export const SearchContainer = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get("language") || "";
  const city = searchParams.get("city") || "";
  const company = searchParams.get("company") || "";
  const keyword = searchParams.get("keyword") || "";
  const position = searchParams.get("position") || "";
  const workingForm = searchParams.get("workingForm") || "";
  const pageParam = parseInt(searchParams.get("page") || "1");
  const [jobList, setJobList] = useState<any[]>([]);
  const [totalRecord, setTotalRecord] = useState<number | null>(null); // null = loading
  const [totalPage, setTotalPage] = useState<number>(1);
  const [currentPage, setCurrentPage] = useState<number>(pageParam || 1);
  const [cityList, setCityList] = useState<any[]>([]);
  const [selectedCity, setSelectedCity] = useState<any>(null);
  const [languageList, setLanguageList] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch languages/technologies
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/technologies`, {
      method: "GET"
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "success") {
          // Prefer slug values for display and filtering.
          const toSlug = (s: any) => s?.toString().toLowerCase().trim()
            .normalize('NFD').replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '') || '';

          // Prefer full list (technologiesWithSlug) over top 5
          if (data.technologiesWithSlug && Array.isArray(data.technologiesWithSlug)) {
            setLanguageList(data.technologiesWithSlug.map((it: any) => it.slug || toSlug(it.name)));
          } else if (data.topTechnologies && Array.isArray(data.topTechnologies)) {
            setLanguageList(data.topTechnologies.map((it: any) => it.slug || toSlug(it.name)));
          } else if (data.technologies && Array.isArray(data.technologies)) {
            // last resort: derive slug-like values from provided names
            setLanguageList(data.technologies.map((n: any) => toSlug(n)));
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch technologies:', err);
      })
  }, []);

  // Fetch cities
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/city`, {
      method: "GET"
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "success") {
          // Sort cities alphabetically by name
          const sortedCities = data.cityList.sort((a: any, b: any) => 
            a.name.localeCompare(b.name, 'vi')
          );
          setCityList(sortedCities);
          
          // Find selected city for display
          if(city) {
            // Try exact slug match first
            let found = sortedCities.find((c: any) => c.slug === city);

            // Fallback: allow matching when DB slugs have a short suffix 
            if(!found) {
              found = sortedCities.find((c: any) => c.slug && c.slug.startsWith(city));
            }

            // Fallback: match by normalized name 
            if(!found) {
              const normalize = (s: string) => s
                .toString()
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9\-]/g, '');
              const normCity = normalize(city.replace(/-+$/g, ''));
              found = sortedCities.find((c: any) => {
                const n = normalize(c.name);
                return n === normCity || n.includes(normCity);
              });
            }

            setSelectedCity(found || null);
          } else {
            // Clear selected city when no city param
            setSelectedCity(null);
          }
        }
      })
      .catch((err) => {
        console.error('Failed to fetch cities:', err);
      })
  }, [city]);

  // Fetch jobs with pagination
  useEffect(() => {
    const page = currentPage || 1;
    const pageSize = paginationConfig?.searchResults || 9;
    const url = `${process.env.NEXT_PUBLIC_API_URL}/search?language=${language}&city=${city}&company=${company}&keyword=${keyword}&position=${position}&workingForm=${workingForm}&page=${page}&limit=${pageSize}`;
    
    fetch(url, { method: "GET" })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        if(data.code == "success") {
          setJobList(data.jobs || []);
          if (data.pagination) {
            setTotalRecord(data.pagination.totalRecord || 0);
            setTotalPage(data.pagination.totalPage || 1);
            setCurrentPage(data.pagination.currentPage || 1);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Search failed:', err);
      });
  }, [language, city, company, keyword, position, workingForm, currentPage]);

  const handleFilterPosition = (event: any) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if(value) {
      params.set("position", value);
    } else {
      params.delete("position");
    }
    router.push(`?${params.toString()}`);
  }

  const handleFilterWorkingForm = (event: any) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if(value) {
      params.set("workingForm", value);
    } else {
      params.delete("workingForm");
    }
    router.push(`?${params.toString()}`);
  }

  const handleFilterCity = (event: any) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if(value) {
      params.set("city", value);
    } else {
      params.delete("city");
    }
    router.push(`?${params.toString()}`);
  }

  const handleFilterLanguage = (event: any) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if(value) {
      params.set("language", value);
    } else {
      params.delete("language");
    }
    // reset to first page when filters change
    params.delete("page");
    router.push(`?${params.toString()}`);
  }

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (newPage && newPage > 1) params.set('page', String(newPage)); else params.delete('page');
    router.push(`?${params.toString()}`);
    setCurrentPage(newPage);
  }

  return (
    <>
      {/* Section 1 */}
      <Section1 city={city} keyword={keyword} />
      {/* End Section 1 */}

      {/* Search Results */}
      <div className="py-[60px]">
        <div className="container">
          <h2 className="font-[700] text-[28px] text-[#121212] mb-[30px]">
            {totalRecord === null ? <NumberSkeleton /> : totalRecord} jobs 
            <span className="text-[#0088FF]">
              {language && ` ${language}`}
              {selectedCity?.name && ` ${selectedCity.name}`}
              {company && ` ${company}`}
              {keyword && ` ${keyword}`}
            </span>
          </h2>
          
          {/* Filter */}
          <div 
            className="rounded-[8px] bg-white py-[10px] px-[20px] flex flex-wrap gap-[12px] mb-[30px]"
            style={{
              boxShadow: "0px 4px 20px 0px #0000000F"
            }}
          >
            <select 
              className="w-[148px] h-[36px] border border-[#DEDEDE] rounded-[20px] px-[18px] font-[400] text-[16px] text-[#414042] cursor-pointer hover:border-[#0088FF] transition-colors duration-200"
              onChange={handleFilterPosition}
              value={position}
            >
              <option value="">Level</option>
              {positionList.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select 
              className="w-[206px] h-[36px] border border-[#DEDEDE] rounded-[20px] px-[18px] font-[400] text-[16px] text-[#414042] cursor-pointer hover:border-[#0088FF] transition-colors duration-200"
              onChange={handleFilterWorkingForm}
              value={workingForm}
            >
              <option value="">Working Form</option>
              {workingFormList.map(item => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <select 
              className="w-[206px] h-[36px] border border-[#DEDEDE] rounded-[20px] px-[18px] font-[400] text-[16px] text-[#414042] cursor-pointer hover:border-[#0088FF] transition-colors duration-200"
              onChange={handleFilterLanguage}
              value={language}
            >
              <option value="">All Skills</option>
              {languageList.map((item: string, index: number) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select 
              className="w-[206px] h-[36px] border border-[#DEDEDE] rounded-[20px] px-[18px] font-[400] text-[16px] text-[#414042] cursor-pointer hover:border-[#0088FF] transition-colors duration-200"
              onChange={handleFilterCity}
              value={city}
            >
              <option value="">All Cities</option>
              {cityList.map((item: any) => (
                <option key={item._id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job List */}
          {loading ? (
            <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
              {Array(6).fill(null).map((_, i) => <JobCardSkeleton key={`job-skeleton-${i}`} />)}
            </div>
          ) : jobList.length > 0 ? (
            <>
              <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
                {jobList.map((item, index) => (
                  <CardJobItem key={item._id || item.id || `job-${index}`} item={item} />
                ))}
              </div>

              {/* Pagination */}
              <Pagination
                currentPage={currentPage}
                totalPage={totalPage}
                totalRecord={totalRecord ?? 0}
                skip={(currentPage - 1) * paginationConfig.searchResults}
                currentCount={jobList.length}
                onPageChange={handlePageChange}
              />
            </>
          ) : (
            <div className="text-center py-[60px] bg-[#F5F5F5] rounded-[8px]">
              <div className="text-[48px] mb-[16px] text-[#666]"><FaSearch /></div>
              <h3 className="font-[700] text-[20px] text-[#121212] mb-[8px]">
                No jobs found
              </h3>
              <p className="text-[#666] text-[14px]">
                Try adjusting your search filters or browse all jobs
              </p>
            </div>
          )}
        </div>
      </div>
      {/* End Search Results */}
    </>
  )
}