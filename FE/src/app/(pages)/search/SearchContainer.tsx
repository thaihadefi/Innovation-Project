"use client"
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { Section1 } from "@/app/components/section/Section1";
import { positionList, workingFormList, paginationConfig } from "@/configs/variable";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { Pagination } from "@/app/components/pagination/Pagination";
import { JobCardSkeleton } from "@/app/components/ui/CardSkeleton";
import { FaSearch } from "react-icons/fa";
import { normalizeKeyword } from "@/utils/keyword";

type SearchContainerProps = {
  initialJobs?: any[];
  initialTotalRecord?: number | null;
  initialTotalPage?: number;
  initialCurrentPage?: number;
  initialSkills?: string[];
  initialAllSkills?: string[];
  initialLocations?: any[];
  initialSelectedLocation?: any | null;
};

export const SearchContainer = ({
  initialJobs = [],
  initialTotalRecord = null,
  initialTotalPage = 1,
  initialCurrentPage = 1,
  initialSkills = [],
  initialAllSkills = [],
  initialLocations = [],
  initialSelectedLocation = null
}: SearchContainerProps) => {
  const SEARCH_CACHE_TTL_MS = 30_000;
  const searchParams = useSearchParams();
  const router = useRouter();
  const searchParamsString = searchParams.toString();
  const initialSkill = searchParams.get("skill") || "";
  const initialLocation = searchParams.get("location") || "";
  const initialCompany = searchParams.get("company") || "";
  const initialKeyword = searchParams.get("keyword") || "";
  const initialPosition = searchParams.get("position") || "";
  const initialWorkingForm = searchParams.get("workingForm") || "";
  const initialPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10) || 1);

  const hasServerSearchData =
    initialTotalRecord !== null &&
    initialTotalRecord !== undefined &&
    initialCurrentPage !== undefined;

  const [jobList, setJobList] = useState<any[]>(initialJobs);
  const [totalRecord, setTotalRecord] = useState<number | null>(initialTotalRecord); // null = loading
  const [totalPage, setTotalPage] = useState<number>(initialTotalPage);
  const [currentPage, setCurrentPage] = useState<number>(initialCurrentPage || initialPage);
  const [locationList, setLocationList] = useState<any[]>(initialLocations);
  const [selectedLocation, setSelectedLocation] = useState<any>(initialSelectedLocation || null);
  const [skillList, setSkillList] = useState<string[]>(
    (initialAllSkills && initialAllSkills.length > 0) ? initialAllSkills : (initialSkills || [])
  );
  const [topSkillList, setTopSkillList] = useState<string[]>(initialSkills || []);
  const [loading, setLoading] = useState(!hasServerSearchData);
  const [skill, setSkill] = useState<string>(initialSkill);
  const [location, setLocation] = useState<string>(initialLocation);
  const [company, setCompany] = useState<string>(initialCompany);
  const [keywordInput, setKeywordInput] = useState<string>(initialKeyword);
  const [position, setPosition] = useState<string>(initialPosition);
  const [workingForm, setWorkingForm] = useState<string>(initialWorkingForm);
  const [debouncedFilters, setDebouncedFilters] = useState({
    skill: initialSkill,
    location: initialLocation,
    company: initialCompany,
    keyword: initialKeyword,
    position: initialPosition,
    workingForm: initialWorkingForm,
    page: initialPage
  });
  const [keywordError, setKeywordError] = useState<string>("");
  const [keywordInvalid, setKeywordInvalid] = useState<boolean>(false);
  const [showLoadingHint, setShowLoadingHint] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [reloadKey, setReloadKey] = useState<number>(0);
  
  // Track if this is the first mount with server data
  const isFirstMount = useRef(true);
  const hasInitialData = useRef(hasServerSearchData);
  const latestSearchRequestIdRef = useRef(0);
  const searchCacheRef = useRef<Map<string, any>>(new Map());

  const normalizeLocationText = useCallback(
    (value: string) =>
      value
        .toString()
        .toLowerCase()
        .normalize("NFD")
        .replace(/\p{Diacritic}/gu, "")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, ""),
    []
  );

  const findLocationByQuery = useCallback((locations: any[], queryLocation: string) => {
    if (!queryLocation || !Array.isArray(locations) || locations.length === 0) return null;

    const suffixMatch = queryLocation.match(/-(?:[a-f0-9]{6})$/i);
    const baseLocation = suffixMatch ? queryLocation.replace(/-(?:[a-f0-9]{6})$/i, "") : queryLocation;

    let found = locations.find((c: any) => c.slug === queryLocation || c.slug === baseLocation);
    if (found) return found;

    found = locations.find(
      (c: any) =>
        c.slug &&
        (c.slug.startsWith(queryLocation) ||
          c.slug.startsWith(baseLocation) ||
          queryLocation.startsWith(c.slug))
    );
    if (found) return found;

    const normalizedQuery = normalizeLocationText(baseLocation.replace(/-+$/g, ""));
    return (
      locations.find((c: any) => {
        const normalizedName = normalizeLocationText(c.name);
        return (
          normalizedName === normalizedQuery ||
          normalizedName.includes(normalizedQuery) ||
          (c.slug && c.slug.includes(normalizedQuery))
        );
      }) || null
    );
  }, [normalizeLocationText]);

  // Fetch skills/skills only if not provided
  useEffect(() => {
    if ((initialAllSkills && initialAllSkills.length > 0) && initialSkills.length > 0) return;
    const controller = new AbortController();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/skills`, {
      method: "GET",
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (controller.signal.aborted) return;
        if(data.code == "success") {
          // Prefer slug values for display and filtering.
          const toSlug = (s: any) => s?.toString().toLowerCase().trim()
            .normalize('NFD').replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '') || '';

          const fullWithSlug = (data.skillsWithSlug && Array.isArray(data.skillsWithSlug))
            ? data.skillsWithSlug.map((it: any) => it.slug || toSlug(it.name))
            : [];
          const fullRaw = Array.isArray(data.skills)
            ? data.skills.map((n: any) => toSlug(n))
            : [];
          const topFallback = (data.topSkills && Array.isArray(data.topSkills))
            ? data.topSkills.map((item: any) => item.slug || toSlug(item.name))
            : [];
          
          const allList = fullWithSlug.length > 0
            ? fullWithSlug
            : (fullRaw.length > 0 ? fullRaw : (topFallback.length > 0 ? topFallback : ["html5", "css3", "javascript", "reactjs", "nodejs"]));
          const topList = topFallback.length > 0 ? topFallback : allList.slice(0, paginationConfig.topSkills);

          setSkillList(allList);
          setTopSkillList(topList);
        }
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        console.error('Failed to fetch skills:', err);
        setSkillList(["html5", "css3", "javascript", "reactjs", "nodejs"]);
        setTopSkillList(["html5", "css3", "javascript", "reactjs", "nodejs"]);
      });
    return () => controller.abort();
  }, [initialAllSkills, initialSkills]);

  // Resolve selected location whenever query/location list changes
  useEffect(() => {
    if (!location) {
      setSelectedLocation(null);
      return;
    }
    const source = locationList.length > 0 ? locationList : initialLocations;
    if (!source || source.length === 0) return;
    setSelectedLocation(findLocationByQuery(source, location));
  }, [location, locationList, initialLocations, findLocationByQuery]);

  // Fetch locations only once when not provided by server
  useEffect(() => {
    if (initialLocations.length > 0 || locationList.length > 0) return;
    const controller = new AbortController();

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/location`, {
      method: "GET",
      signal: controller.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (controller.signal.aborted) return;
        if(data.code == "success") {
          // Sort locations alphabetically by name
          setLocationList(sortLocationsWithOthersLast(data.locationList));
        }
      })
      .catch((err: any) => {
        if (err?.name === "AbortError") return;
        console.error('Failed to fetch locations:', err);
      });
    return () => controller.abort();
  }, [initialLocations, locationList.length]);

  // Debounce all filters to avoid rapid fetches.
  useEffect(() => {
    const normalizedKeyword = normalizeKeyword(keywordInput);
    if (!normalizedKeyword.isValid) {
      setKeywordInvalid(true);
      return;
    }
    setKeywordInvalid(false);
    const effectiveKeyword = normalizedKeyword.value;
    const timer = setTimeout(() => {
      const nextFilters = {
        skill,
        location,
        company,
        keyword: effectiveKeyword,
        position,
        workingForm,
        page: currentPage
      };
      setDebouncedFilters((prev) => {
        if (
          prev.skill === nextFilters.skill &&
          prev.location === nextFilters.location &&
          prev.company === nextFilters.company &&
          prev.keyword === nextFilters.keyword &&
          prev.position === nextFilters.position &&
          prev.workingForm === nextFilters.workingForm &&
          prev.page === nextFilters.page
        ) {
          return prev;
        }
        return nextFilters;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [skill, location, company, position, workingForm, currentPage, keywordInput]);

  // Sync local filter state when Next.js query params change on the same route.
  // This handles cases like clicking skill tags that only update URL query.
  useEffect(() => {
    const params = new URLSearchParams(searchParamsString);
    const nextSkill = params.get("skill") || "";
    const nextLocation = params.get("location") || "";
    const nextCompany = params.get("company") || "";
    const nextKeyword = params.get("keyword") || "";
    const nextPosition = params.get("position") || "";
    const nextWorkingForm = params.get("workingForm") || "";
    const nextPage = Math.max(1, parseInt(params.get("page") || "1", 10) || 1);

    setSkill(prev => (prev === nextSkill ? prev : nextSkill));
    setLocation(prev => (prev === nextLocation ? prev : nextLocation));
    setCompany(prev => (prev === nextCompany ? prev : nextCompany));
    setKeywordInput(prev => (prev === nextKeyword ? prev : nextKeyword));
    setPosition(prev => (prev === nextPosition ? prev : nextPosition));
    setWorkingForm(prev => (prev === nextWorkingForm ? prev : nextWorkingForm));
    setCurrentPage(prev => (prev === nextPage ? prev : nextPage));
  }, [searchParamsString]);

  // Clear results immediately when keyword is invalid
  useEffect(() => {
    if (!keywordInvalid) return;
    setLoading(false);
    setJobList([]);
    setTotalRecord(0);
    setTotalPage(1);
    setCurrentPage(1);
  }, [keywordInvalid]);

  // Delay loading hint slightly to avoid UI flash for very fast responses.
  useEffect(() => {
    if (!loading) {
      setShowLoadingHint(false);
      return;
    }
    const timer = setTimeout(() => setShowLoadingHint(true), 150);
    return () => clearTimeout(timer);
  }, [loading]);

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
    if (debouncedFilters.skill) params.set('skill', debouncedFilters.skill);
    if (debouncedFilters.location) params.set('location', debouncedFilters.location);
    if (debouncedFilters.company) params.set('company', debouncedFilters.company);
    if (debouncedFilters.keyword) params.set('keyword', debouncedFilters.keyword);
    if (debouncedFilters.position) params.set('position', debouncedFilters.position);
    if (debouncedFilters.workingForm) params.set('workingForm', debouncedFilters.workingForm);
    params.set('page', String(page));
    params.set('limit', String(pageSize));

    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    const url = `${apiBase.replace(/\/+$/, '')}/search?${params.toString()}`;

    const cached = searchCacheRef.current.get(url);
    if (cached && Date.now() - cached.ts < SEARCH_CACHE_TTL_MS) {
      const data = cached.data;
      setJobList(data.jobs || []);
      if (data.pagination) {
        setTotalRecord(data.pagination.totalRecord || 0);
        setTotalPage(data.pagination.totalPage || 1);
        setCurrentPage(data.pagination.currentPage || 1);
      }
      setErrorMessage("");
      setLoading(false);
      return;
    }

    // Keep previous results rendered while loading (see render condition below).
    setLoading(true);
    setErrorMessage("");

    const controller = new AbortController();
    const signal = controller.signal;
    const requestId = ++latestSearchRequestIdRef.current;

    (async () => {
      try {
        const res = await fetch(url, { method: 'GET', signal });
        if (!res.ok) throw new Error(`Network response was not ok (status=${res.status})`);
        const data = await res.json();
        if (signal.aborted || requestId !== latestSearchRequestIdRef.current) return;
        if (data.code == 'success') {
          searchCacheRef.current.set(url, { ts: Date.now(), data });
          setJobList(data.jobs || []);
          if (data.pagination) {
            setTotalRecord(data.pagination.totalRecord || 0);
            setTotalPage(data.pagination.totalPage || 1);
            setCurrentPage(data.pagination.currentPage || 1);
          }
          setErrorMessage("");
        } else {
          // Backend returned non-success code
          console.error('Search API returned non-success code', { url, body: data });
          setErrorMessage("Unable to load jobs. Please try again.");
        }
      } catch (err: any) {
        // Provide detailed logs to help debug network/CORS/URL issues
        if (err?.name !== "AbortError" && requestId === latestSearchRequestIdRef.current) {
          console.error('Search failed:', { url, message: err?.message || err, err });
          setErrorMessage("Unable to load jobs. Please try again.");
        }
      } finally {
        if (!signal.aborted && requestId === latestSearchRequestIdRef.current) {
          setLoading(false);
        }
      }
    })();
    return () => {
      controller.abort();
    };
  }, [debouncedFilters, keywordInvalid, reloadKey]);

  // Keep URL in sync without triggering navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams();
    if (skill) params.set("skill", skill);
    if (location) params.set("location", location);
    if (company) params.set("company", company);
    const normalizedKeyword = normalizeKeyword(keywordInput);
    if (normalizedKeyword.isValid && normalizedKeyword.value && !keywordInvalid) {
      params.set("keyword", normalizedKeyword.value);
    }
    if (position) params.set("position", position);
    if (workingForm) params.set("workingForm", workingForm);
    if (currentPage > 1) params.set("page", String(currentPage));
    const url = `/search${params.toString() ? "?" + params.toString() : ""}`;
    if (`${window.location.pathname}${window.location.search}` !== url) {
      window.history.replaceState(null, "", url);
    }
  }, [skill, location, company, keywordInput, keywordInvalid, position, workingForm, currentPage]);

  // Sync state on back/forward navigation
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      setSkill(params.get("skill") || "");
      setLocation(params.get("location") || "");
      setCompany(params.get("company") || "");
      const kw = params.get("keyword") || "";
      setKeywordInput(kw);
      const normalizedKeyword = normalizeKeyword(kw);
      if (!normalizedKeyword.isValid) {
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

  const handleFilterLocation = (event: any) => {
    const value = event.target.value;
    setLocation(value);
    setCurrentPage(1);
  }

  const handleFilterSkill = (event: any) => {
    const value = event.target.value;
    setSkill(value);
    setCurrentPage(1);
  }

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  }

  const selectedPositionLabel =
    positionList.find((item) => item.value === position)?.label || position;
  const selectedWorkingFormLabel =
    workingFormList.find((item) => item.value === workingForm)?.label || workingForm;
  const normalizedKeywordLabel = normalizeKeyword(keywordInput);

  return (
    <>
      {/* Section 1 */}
      <Section1 
        managed={true}
        currentLocation={location}
        currentKeyword={keywordInput}
        onLocationChange={(value) => {
          setLocation(value);
          setCurrentPage(1);
        }}
        onKeywordChange={(value) => {
          const normalizedKeyword = normalizeKeyword(value);
          if (!normalizedKeyword.isValid) {
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
          const normalizedKeyword = normalizeKeyword(keywordInput);
          if (!normalizedKeyword.isValid) {
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
        initialSkills={topSkillList.length > 0 ? topSkillList : (initialSkills.length > 0 ? initialSkills : undefined)}
        allSkills={skillList.length > 0 ? skillList : undefined}
        initialLocations={initialLocations.length > 0 ? initialLocations : undefined}
      />
      {/* End Section 1 */}

      {/* Search Results */}
      <div className="py-[60px]">
        <div className="container">
          <h2 className="font-[700] text-[28px] text-[#121212] mb-[30px]">
            {totalRecord ?? 0} jobs 
            <span className="text-[#0088FF]">
              {selectedPositionLabel && ` ${selectedPositionLabel}`}
              {selectedWorkingFormLabel && ` ${selectedWorkingFormLabel}`}
              {skill && ` ${skill}`}
              {selectedLocation?.name && ` ${selectedLocation.name}`}
              {company && ` ${company}`}
              {(normalizedKeywordLabel.isValid && normalizedKeywordLabel.value ? ` ${normalizedKeywordLabel.value}` : "")}
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
              onChange={handleFilterSkill}
              value={skill}
            >
              <option value="">All Skills</option>
              {skillList.map((item: string, index: number) => (
                <option key={index} value={item}>
                  {item}
                </option>
              ))}
            </select>
            <select 
              className="w-[206px] h-[36px] border border-[#DEDEDE] rounded-[20px] px-[18px] font-[400] text-[16px] text-[#414042] cursor-pointer hover:border-[#0088FF] transition-colors duration-200"
              onChange={handleFilterLocation}
              value={location}
            >
              <option value="">All Locations</option>
              {locationList.map((item: any) => (
                <option key={item._id} value={item.slug}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          {/* Job List */}
          {showLoadingHint && (
            <div
              className="mb-[16px] inline-flex items-center gap-[8px] text-[14px] font-[600] text-[#0B60D1]"
              role="status"
              aria-live="polite"
              aria-atomic="true"
            >
              <span className="inline-block h-[14px] w-[14px] rounded-full border-2 border-[#0B60D1]/30 border-t-[#0B60D1] animate-spin" />
              {jobList.length > 0 ? "Updating results..." : "Searching..."}
            </div>
          )}
          {loading && jobList.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
              {Array(6).fill(null).map((_, i) => <JobCardSkeleton key={`job-skeleton-${i}`} />)}
            </div>
          ) : errorMessage && jobList.length === 0 ? (
            <div className="rounded-[12px] border border-[#E8ECF3] bg-white px-[20px] py-[56px] text-center shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
              <p className="mb-[12px] text-[16px] text-[#64748B]">{errorMessage}</p>
              <button
                type="button"
                onClick={() => setReloadKey((prev) => prev + 1)}
                className="h-[42px] rounded-[10px] bg-[#0088FF] px-[16px] text-[14px] font-[700] text-white transition hover:bg-[#0B60D1]"
              >
                Retry
              </button>
            </div>
          ) : jobList.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
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
            <div className="rounded-[12px] border border-[#E8ECF3] bg-white px-[20px] py-[56px] text-center shadow-[0_8px_24px_rgba(16,24,40,0.06)]">
              <div className="mx-auto mb-[18px] flex h-[72px] w-[72px] items-center justify-center rounded-full bg-[#F2F7FF] text-[#0088FF]">
                <FaSearch className="text-[30px]" />
              </div>
              <h3 className="mb-[8px] font-[700] text-[26px] leading-[1.2] text-[#0F172A]">
                No jobs found
              </h3>
              <p className="mx-auto max-w-[620px] text-[16px] leading-[1.6] text-[#64748B]">
                Try adjusting your search filters or browse all available jobs.
              </p>
              <div className="mt-[22px] flex flex-wrap items-center justify-center gap-[10px]">
                <button
                  onClick={() => {
                    setSkill("");
                    setLocation("");
                    setCompany("");
                    setKeywordInput("");
                    setPosition("");
                    setWorkingForm("");
                    setCurrentPage(1);
                    setKeywordError("");
                    setKeywordInvalid(false);
                    setSelectedLocation(null);
                  }}
                  className="h-[42px] rounded-[10px] border border-[#D7E3F7] bg-white px-[16px] text-[14px] font-[600] text-[#334155] transition hover:border-[#0088FF] hover:text-[#0B60D1]"
                >
                  Clear filters
                </button>
                <button
                  onClick={() => {
                    router.push("/search");
                  }}
                  className="h-[42px] rounded-[10px] bg-[#0088FF] px-[16px] text-[14px] font-[700] text-white transition hover:bg-[#0B60D1]"
                >
                  Browse all jobs
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* End Search Results */}
    </>
  )
}
