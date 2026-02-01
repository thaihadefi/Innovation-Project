"use client"
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { Section1 } from "@/app/components/section/Section1";
import { positionList, workingFormList, paginationConfig } from "@/configs/variable";
import { sortCitiesWithOthersLast } from "@/utils/citySort";
import { useSearchParams } from "next/navigation";
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
  initialAllLanguages?: string[];
  initialCities?: any[];
  initialSelectedCity?: any | null;
};

export const SearchContainer = ({
  initialJobs = [],
  initialTotalRecord = null,
  initialTotalPage = 1,
  initialCurrentPage = 1,
  initialLanguages = [],
  initialAllLanguages = [],
  initialCities = [],
  initialSelectedCity = null
}: SearchContainerProps) => {
  const searchParams = useSearchParams();
  const initialLanguage = searchParams.get("language") || "";
  const initialCity = searchParams.get("city") || "";
  const initialCompany = searchParams.get("company") || "";
  const initialKeyword = searchParams.get("keyword") || "";
  const initialPosition = searchParams.get("position") || "";
  const initialWorkingForm = searchParams.get("workingForm") || "";
  const initialPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const [jobList, setJobList] = useState<any[]>(initialJobs);
  const [totalRecord, setTotalRecord] = useState<number | null>(initialTotalRecord); // null = loading
  const [totalPage, setTotalPage] = useState<number>(initialTotalPage);
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage || initialPage);
  const [cityList, setCityList] = useState<any[]>(initialCities);
  const [selectedCity, setSelectedCity] = useState<any>(initialSelectedCity || null);
  const [languageList, setLanguageList] = useState<string[]>(
    (initialAllLanguages && initialAllLanguages.length > 0) ? initialAllLanguages : (initialLanguages || [])
  );
  const [topLanguageList, setTopLanguageList] = useState<string[]>(initialLanguages || []);
  const [loading, setLoading] = useState(initialJobs.length === 0);
  const [language, setLanguage] = useState<string>(initialLanguage);
  const [city, setCity] = useState<string>(initialCity);
  const [company, setCompany] = useState<string>(initialCompany);
  const [keywordInput, setKeywordInput] = useState<string>(initialKeyword);
  const [position, setPosition] = useState<string>(initialPosition);
  const [workingForm, setWorkingForm] = useState<string>(initialWorkingForm);
  const [debouncedFilters, setDebouncedFilters] = useState({
    language: initialLanguage,
    city: initialCity,
    company: initialCompany,
    keyword: initialKeyword,
    position: initialPosition,
    workingForm: initialWorkingForm,
    page: initialPage
  });
  const [keywordError, setKeywordError] = useState<string>("");
  const [keywordInvalid, setKeywordInvalid] = useState<boolean>(false);
  
  // Track if this is the first mount with server data
  const isFirstMount = useRef(true);
  const hasInitialData = useRef(initialJobs.length > 0);

  // Fetch languages/technologies only if not provided
  useEffect(() => {
    if ((initialAllLanguages && initialAllLanguages.length > 0) && initialLanguages.length > 0) return;
    
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
          
          const allList = fullWithSlug.length > 0
            ? fullWithSlug
            : (fullRaw.length > 0 ? fullRaw : (topFallback.length > 0 ? topFallback : ["html5", "css3", "javascript", "reactjs", "nodejs"]));
          const topList = topFallback.length > 0 ? topFallback : allList.slice(0, 5);

          setLanguageList(allList);
          setTopLanguageList(topList);
        }
      })
      .catch((err) => {
        console.error('Failed to fetch technologies:', err);
        setLanguageList(["html5", "css3", "javascript", "reactjs", "nodejs"]);
        setTopLanguageList(["html5", "css3", "javascript", "reactjs", "nodejs"]);
      })
  }, [initialAllLanguages, initialLanguages]);

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

  // Debounce all filters to avoid rapid fetches (150ms)
  useEffect(() => {
    const trimmed = keywordInput.trim();
    if (trimmed && !/[a-z0-9]/i.test(trimmed)) {
      setKeywordInvalid(true);
      return;
    }
    setKeywordInvalid(false);
    const timer = setTimeout(() => {
      setDebouncedFilters({
        language,
        city,
        company,
        keyword: keywordInput,
        position,
        workingForm,
        page: currentPage
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [language, city, company, position, workingForm, currentPage, keywordInput]);

  // Clear results immediately when keyword is invalid
  useEffect(() => {
    if (!keywordInvalid) return;
    setLoading(false);
    setJobList([]);
    setTotalRecord(0);
    setTotalPage(1);
    setCurrentPage(1);
  }, [keywordInvalid]);

  // Fetch jobs with pagination - skip on first mount if we have server data
  useEffect(() => {
    if (keywordInvalid) {
      return;
    }
    // Skip initial fetch if we have server data
    if (isFirstMount.current && hasInitialData.current) {
      isFirstMount.current = false;
      return;
    }
    
    const page = debouncedFilters.page || 1;
    const pageSize = paginationConfig?.searchResults || 9;

    // Build query safely using URLSearchParams to ensure proper encoding
    const params = new URLSearchParams();
    if (debouncedFilters.language) params.set('language', debouncedFilters.language);
    if (debouncedFilters.city) params.set('city', debouncedFilters.city);
    if (debouncedFilters.company) params.set('company', debouncedFilters.company);
    if (debouncedFilters.keyword) params.set('keyword', debouncedFilters.keyword);
    if (debouncedFilters.position) params.set('position', debouncedFilters.position);
    if (debouncedFilters.workingForm) params.set('workingForm', debouncedFilters.workingForm);
    params.set('page', String(page));
    params.set('limit', String(pageSize));

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${apiBase.replace(/\/+$/, '')}/search?${params.toString()}`;

    setLoading(true);

    const controller = new AbortController();
    const signal = controller.signal;

    (async () => {
      try {
        const res = await fetch(url, { method: 'GET', signal });
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
        if (err?.name !== "AbortError") {
          console.error('Search failed:', { url, message: err?.message || err, err });
        }
      } finally {
        if (!signal.aborted) {
          setLoading(false);
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [debouncedFilters, keywordInvalid]);

  // Keep URL in sync without triggering navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (language) params.set("language", language);
    if (city) params.set("city", city);
    if (company) params.set("company", company);
    const trimmedKeyword = keywordInput.trim();
    if (trimmedKeyword && /[a-z0-9]/i.test(trimmedKeyword) && !keywordInvalid) {
      params.set("keyword", keywordInput);
    }
    if (position) params.set("position", position);
    if (workingForm) params.set("workingForm", workingForm);
    if (currentPage > 1) params.set("page", String(currentPage));
    const url = `/search${params.toString() ? "?" + params.toString() : ""}`;
    window.history.replaceState(null, "", url);
  }, [language, city, company, keywordInput, position, workingForm, currentPage]);

  // Sync state on back/forward navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setLanguage(params.get("language") || "");
      setCity(params.get("city") || "");
      setCompany(params.get("company") || "");
      const kw = params.get("keyword") || "";
      setKeywordInput(kw);
      const trimmed = kw.trim();
      if (trimmed && !/[a-z0-9]/i.test(trimmed)) {
        setKeywordError("Please enter at least 1 alphanumeric character.");
      } else {
        setKeywordError("");
      }
      setPosition(params.get("position") || "");
      setWorkingForm(params.get("workingForm") || "");
      const pageFromUrl = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);
      setCurrentPage(pageFromUrl);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const handleFilterPosition = (event: any) => {
    const value = event.target.value;
    setPosition(value);
    setCurrentPage(1);
  }

  const handleFilterWorkingForm = (event: any) => {
    const value = event.target.value;
    setWorkingForm(value);
    setCurrentPage(1);
  }

  const handleFilterCity = (event: any) => {
    const value = event.target.value;
    setCity(value);
    setCurrentPage(1);
  }

  const handleFilterLanguage = (event: any) => {
    const value = event.target.value;
    setLanguage(value);
    setCurrentPage(1);
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  }

  return (
    <>
      {/* Section 1 */}
      <Section1 
        managed={true}
        currentCity={city}
        currentKeyword={keywordInput}
        onCityChange={(value) => {
          setCity(value);
          setCurrentPage(1);
        }}
        onKeywordChange={(value) => {
          const trimmed = value.trim();
          if (trimmed && !/[a-z0-9]/i.test(trimmed)) {
            setKeywordError("Please enter at least 1 alphanumeric character.");
            setKeywordInvalid(true);
          } else {
            setKeywordError("");
            setKeywordInvalid(false);
          }
          setKeywordInput(value);
          setCurrentPage(1);
        }}
        onSearch={() => {
          const trimmed = keywordInput.trim();
          if (trimmed && !/[a-z0-9]/i.test(trimmed)) {
            setKeywordError("Please enter at least 1 alphanumeric character.");
            setKeywordInvalid(true);
            return;
          }
          setKeywordError("");
          setKeywordInvalid(false);
          setCurrentPage(1);
        }}
        keywordError={keywordError}
        initialTotalJobs={initialTotalRecord ?? undefined}
        currentTotalJobs={totalRecord}
        initialLanguages={topLanguageList.length > 0 ? topLanguageList : (initialLanguages.length > 0 ? initialLanguages : undefined)}
        allLanguages={languageList.length > 0 ? languageList : undefined}
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
              {(/[a-z0-9]/i.test(keywordInput.trim()) ? ` ${keywordInput}` : "")}
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
