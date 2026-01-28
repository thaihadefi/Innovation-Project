"use client"
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { Section1 } from "@/app/components/section/Section1";
import { positionList, workingFormList, paginationConfig } from "@/configs/variable";
import { sortCitiesWithOthersLast } from "@/utils/citySort";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { Pagination } from "@/app/components/pagination/Pagination";
import { JobCardSkeleton } from "@/app/components/ui/CardSkeleton";
import { FaSearch } from "react-icons/fa";

type SearchContainerProps = {
  initialJobs?: any[];
  initialTotalRecord?: number | null;
  initialTotalPage?: number;
  initialCurrentPage?: number;
  initialLanguages?: string[];
  initialCities?: any[];
  initialSelectedCity?: any | null;
};

export const SearchContainer = ({
  initialJobs = [],
  initialTotalRecord = null,
  initialTotalPage = 1,
  initialCurrentPage = 1,
  initialLanguages = [],
  initialCities = []
  , initialSelectedCity = null
}: SearchContainerProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const language = searchParams.get("language") || "";
  const city = searchParams.get("city") || "";
  const company = searchParams.get("company") || "";
  const keyword = searchParams.get("keyword") || "";
  const position = searchParams.get("position") || "";
  const workingForm = searchParams.get("workingForm") || "";
  const [jobList, setJobList] = useState<any[]>(initialJobs);
  const [totalRecord, setTotalRecord] = useState<number | null>(initialTotalRecord); // null = loading
  const [totalPage, setTotalPage] = useState<number>(initialTotalPage);
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage);
  const [cityList, setCityList] = useState<any[]>(initialCities);
  const [selectedCity, setSelectedCity] = useState<any>(initialSelectedCity || null);
  const [languageList, setLanguageList] = useState<string[]>(initialLanguages);
  const [loading, setLoading] = useState(initialJobs.length === 0);
  
  // Track if this is the first mount with server data
  const isFirstMount = useRef(true);
  const hasInitialData = useRef(initialJobs.length > 0);

  // Fetch languages/technologies only if not provided
  useEffect(() => {
    if (initialLanguages.length > 0) return;
    
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

          const fullWithSlug = (data.technologiesWithSlug && Array.isArray(data.technologiesWithSlug))
            ? data.technologiesWithSlug.map((it: any) => it.slug || toSlug(it.name))
            : [];
          const fullRaw = Array.isArray(data.technologies)
            ? data.technologies.map((n: any) => toSlug(n))
            : [];
          const topFallback = (data.topTechnologies && Array.isArray(data.topTechnologies))
            ? data.topTechnologies.map((item: any) => item.slug || toSlug(item.name))
            : [];
          
          setLanguageList(
            fullWithSlug.length > 0
              ? fullWithSlug
              : (fullRaw.length > 0 ? fullRaw : (topFallback.length > 0 ? topFallback : ["html5", "css3", "javascript", "reactjs", "nodejs"]))
          );
        }
      })
      .catch((err) => {
        console.error('Failed to fetch technologies:', err);
        setLanguageList(["html5", "css3", "javascript", "reactjs", "nodejs"]);
      })
  }, [initialLanguages]);

  // Fetch cities only if not provided
  useEffect(() => {
    if (initialCities.length > 0) {
      // If server already provided a selected city, use it and skip client matching to avoid flash
      if (initialSelectedCity) {
        setSelectedCity(initialSelectedCity);
        return;
      }
      // Use provided cities, just find selected city
      if(city) {
        // Normalize possible slug with short unique suffix (e.g. "tay-ninh-eccb6f")
        const suffixMatch = city.match(/-(?:[a-f0-9]{6})$/i);
        const baseCity = suffixMatch ? city.replace(/-(?:[a-f0-9]{6})$/i, '') : city;

        // Try exact slug match first
        let found = initialCities.find((c: any) => c.slug === city || c.slug === baseCity);

        // Fallback: allow matching when DB slugs have a short suffix or base startsWith
        if(!found) {
          found = initialCities.find((c: any) => c.slug && (c.slug.startsWith(city) || c.slug.startsWith(baseCity) || city.startsWith(c.slug)));
        }

        // Fallback: match by normalized name (handle diacritics)
        if(!found) {
          const normalize = (s: string) => s
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '');
          const normCity = normalize(baseCity.replace(/-+$/g, ''));
          found = initialCities.find((c: any) => {
            const n = normalize(c.name);
            return n === normCity || n.includes(normCity) || (c.slug && c.slug.includes(normCity));
          });
        }

        setSelectedCity(found || null);
      } else {
        // Clear selected city when no city param
        setSelectedCity(null);
      }
      return; // Don't fetch if we have initial data
    }
    
    // Fetch cities from API if not provided
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/city`, {
      method: "GET"
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "success") {
          // Sort cities alphabetically by name
          const sortedCities = sortCitiesWithOthersLast(data.cityList);
          setCityList(sortedCities);
          
          // Find selected city for display
            if(city) {
            const suffixMatch = city.match(/-(?:[a-f0-9]{6})$/i);
            const baseCity = suffixMatch ? city.replace(/-(?:[a-f0-9]{6})$/i, '') : city;

            // Try exact slug match first
            let found = sortedCities.find((c: any) => c.slug === city || c.slug === baseCity);

            // Fallback: allow matching when DB slugs have a short suffix or base startsWith
            if(!found) {
              found = sortedCities.find((c: any) => c.slug && (c.slug.startsWith(city) || c.slug.startsWith(baseCity) || city.startsWith(c.slug)));
            }

            // Fallback: match by normalized name (handle diacritics)
            if(!found) {
              const normalize = (s: string) => s
                .toString()
                .toLowerCase()
                .normalize('NFD')
                .replace(/\p{Diacritic}/gu, '')
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9\-]/g, '');
              const normCity = normalize(baseCity.replace(/-+$/g, ''));
              found = sortedCities.find((c: any) => {
                const n = normalize(c.name);
                return n === normCity || n.includes(normCity) || (c.slug && c.slug.includes(normCity));
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
  }, [city, initialCities, initialSelectedCity]);

  // Fetch jobs with pagination - skip on first mount if we have server data
  useEffect(() => {
    // Skip initial fetch if we have server data
    if (isFirstMount.current && hasInitialData.current) {
      isFirstMount.current = false;
      return;
    }
    
    const page = currentPage || 1;
    const pageSize = paginationConfig?.searchResults || 9;

    // Build query safely using URLSearchParams to ensure proper encoding
    const params = new URLSearchParams();
    if (language) params.set('language', language);
    if (city) params.set('city', city);
    if (company) params.set('company', company);
    if (keyword) params.set('keyword', keyword);
    if (position) params.set('position', position);
    if (workingForm) params.set('workingForm', workingForm);
    params.set('page', String(page));
    params.set('limit', String(pageSize));

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${apiBase.replace(/\/+$/, '')}/search?${params.toString()}`;

    setLoading(true);

    (async () => {
      try {
        const res = await fetch(url, { method: 'GET' });
        if (!res.ok) throw new Error(`Network response was not ok (status=${res.status})`);
        const data = await res.json();
        if (data.code == 'success') {
          setJobList(data.jobs || []);
          if (data.pagination) {
            setTotalRecord(data.pagination.totalRecord || 0);
            setTotalPage(data.pagination.totalPage || 1);
            setCurrentPage(data.pagination.currentPage || 1);
          }
        } else {
          // Backend returned non-success code
          console.error('Search API returned non-success code', { url, body: data });
        }
      } catch (err: any) {
        // Provide detailed logs to help debug network/CORS/URL issues
        console.error('Search failed:', { url, message: err?.message || err, err });
      } finally {
        setLoading(false);
      }
    })();
  }, [language, city, company, keyword, position, workingForm, currentPage]);

  const handleFilterPosition = (event: any) => {
    const value = event.target.value;
    const params = new URLSearchParams(searchParams.toString());
    if(value) {
      params.set("position", value);
    } else {
      params.delete("position");
    }
    // reset to first page when filters change
    params.delete("page");
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
    // reset to first page when filters change
    params.delete("page");
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
    // reset to first page when filters change
    params.delete("page");
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
      <Section1 
        city={city} 
        keyword={keyword} 
        initialTotalJobs={initialTotalRecord ?? undefined}
        initialLanguages={initialLanguages.length > 0 ? initialLanguages : undefined}
        initialCities={initialCities.length > 0 ? initialCities : undefined}
      />
      {/* End Section 1 */}

      {/* Search Results */}
      <div className="py-[60px]">
        <div className="container">
          <h2 className="font-[700] text-[28px] text-[#121212] mb-[30px]">
            {totalRecord ?? 0} jobs 
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
                  <CardJobItem
                    key={item._id || item.id || `job-${index}`}
                    item={item}
                  />
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
