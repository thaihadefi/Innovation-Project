"use client";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FaMagnifyingGlass, FaTriangleExclamation } from "react-icons/fa6";
import { useEffect, useRef, useState } from "react";
import { NumberSkeleton } from "@/app/components/ui/Skeleton";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";
import { paginationConfig } from "@/configs/variable";
import { normalizeKeyword } from "@/utils/keyword";

export const Section1 = (props: {
  location?: string,
  keyword?: string,
  initialTotalJobs?: number,
  currentTotalJobs?: number | null,
  managed?: boolean,
  currentLocation?: string,
  currentKeyword?: string,
  onLocationChange?: (value: string) => void,
  onKeywordChange?: (value: string) => void,
  onSearch?: () => void,
  keywordError?: string,
  initialSkills?: string[],
  allSkills?: string[],
  initialLocations?: any[]
}) => {
  const { 
    location = "", 
    keyword = "", 
    initialTotalJobs, 
    currentTotalJobs,
    managed = false,
    currentLocation: managedLocation,
    currentKeyword: managedKeyword,
    onLocationChange,
    onKeywordChange,
    onSearch,
    keywordError: managedKeywordError,
    initialSkills, 
    allSkills, 
    initialLocations 
  } = props;
  const [skillList, setSkillList] = useState<string[]>(initialSkills || []);
  const [showAllSkills, setShowAllSkills] = useState(false);
  const [locationList, setLocationList] = useState<any[]>(initialLocations || []);
  const [totalJobs, setTotalJobs] = useState<number | null>(initialTotalJobs ?? null); // Use server data if available
  const [currentLocation, setCurrentLocation] = useState(location);
  const [currentKeyword, setCurrentKeyword] = useState(keyword);
  const [keywordError, setKeywordError] = useState<string>("");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isSearchPage = pathname === "/search";
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (managed) {
      return;
    }
    const totalJobsController = new AbortController();
    const skillsController = new AbortController();
    const locationsController = new AbortController();

    // Always background-refresh total jobs to avoid stale SSR counts after job mutations.
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/search`, {
      method: "GET",
      cache: "no-store",
      signal: totalJobsController.signal,
    })
      .then(res => res.json())
      .then(data => {
        if (totalJobsController.signal.aborted) return;
        if(data.code === "success") {
          // Use totalRecord from pagination, not jobs.length
          setTotalJobs(data.pagination?.totalRecord || data.jobs?.length || 0);
        }
      })
      .catch((error: any) => {
        if (error?.name === "AbortError") return;
        if (initialTotalJobs === undefined) {
          setTotalJobs(0); // Fallback to 0 only when no server value exists
        }
      });

    // Only fetch skills if not provided from server
    if (!initialSkills || initialSkills.length === 0) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/skills`, {
        method: "GET",
        signal: skillsController.signal,
      })
        .then(res => res.json())
        .then(data => {
          if (skillsController.signal.aborted) return;
          if(data.code === "success") {
            // small client-side slug generator as a safe fallback
            const toSlug = (s: any) => s?.toString().toLowerCase().trim()
              .normalize('NFD').replace(/\p{Diacritic}/gu, '')
              .replace(/\s+/g, '-')
              .replace(/[^a-z0-9\-]/g, '') || '';

            // Prefer the canonical slug values returned by the API
            const top5 = (data.topSkills && Array.isArray(data.topSkills))
              ? data.topSkills.map((item: any) => item.slug || toSlug(item.name))
              : [];

            const fallback = (data.skillsWithSlug && Array.isArray(data.skillsWithSlug))
              ? data.skillsWithSlug.map((it: any) => it.slug || toSlug(it.name)).slice(0, paginationConfig.topSkills)
              : (Array.isArray(data.skills) ? data.skills.map((n: any) => toSlug(n)).slice(0, paginationConfig.topSkills) : []);

            setSkillList(top5.length > 0 ? top5 : fallback);
          }
        }).catch((error: any) => {
          if (error?.name === "AbortError") return;
          // Fallback to hardcoded list if fetch fails
          setSkillList(["html5", "css3", "javascript", "reactjs", "nodejs"]);
        });
    }

    // Only fetch locations if not provided from server
    if (!initialLocations || initialLocations.length === 0) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/location`, {
        method: "GET",
        signal: locationsController.signal,
      })
        .then(res => res.json())
        .then(data => {
          if (locationsController.signal.aborted) return;
          if(data.code === "success") {
            setLocationList(sortLocationsWithOthersLast(data.locationList));
          }
        }).catch((error: any) => {
          if (error?.name === "AbortError") return;
          // ignore fetch errors here; select will fallback to hardcoded options
        });
    }

    return () => {
      totalJobsController.abort();
      skillsController.abort();
      locationsController.abort();
    };
  }, [managed, initialTotalJobs, initialSkills, initialLocations]);

  useEffect(() => {
    if (!managed) return;
    if (initialSkills && initialSkills.length > 0) {
      setSkillList(initialSkills);
    }
    if (initialLocations && initialLocations.length > 0) {
      setLocationList(initialLocations);
    }
  }, [managed, initialSkills, initialLocations]);

  // Sync state with props when they change (e.g., when navigating)
  useEffect(() => {
    if (managed) {
      return;
    }
    setCurrentLocation(location);
    setCurrentKeyword(keyword);
    setKeywordError("");
  }, [managed, location, keyword]);

  // Keep total jobs in sync with live search results on the search page
  useEffect(() => {
    if (currentTotalJobs !== undefined && currentTotalJobs !== null) {
      setTotalJobs(currentTotalJobs);
    }
  }, [currentTotalJobs]);

  const updateURL = (locationValue: string, keywordValue: string) => {
    const params = new URLSearchParams();
    if(locationValue) params.set("location", locationValue);
    const normalizedKeyword = normalizeKeyword(keywordValue);
    if (normalizedKeyword.isValid && normalizedKeyword.value) {
      params.set("keyword", normalizedKeyword.value);
    }
    const nextUrl = `/search${params.toString() ? '?' + params.toString() : ''}`;
    if (typeof window !== "undefined") {
      const currentUrl = `${window.location.pathname}${window.location.search}`;
      if (currentUrl === nextUrl) return;
    }
    router.replace(nextUrl);
  }

  const handleLocationChange = (event: any) => {
    const value = event.target.value;
    if (managed) {
      onLocationChange?.(value);
      return;
    }
    setCurrentLocation(value);
    // On home page, do not navigate while user is still editing inputs.
    // Navigation to /search should happen on explicit submit.
    if (isSearchPage) {
      updateURL(value, currentKeyword);
    }
  }

  const handleKeywordChange = (event: any) => {
    const value = event.target.value;
    if (managed) {
      onKeywordChange?.(value);
      return;
    }
    setCurrentKeyword(value);
    
    const normalizedKeyword = normalizeKeyword(value);
    if (!normalizedKeyword.isValid) {
      setKeywordError("Please enter at least 1 alphanumeric character.");
      return;
    }
    setKeywordError("");
    if (!isSearchPage) {
      return;
    }
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updateURL(currentLocation, value);
    }, 300);
  }

  const handleSearch = (event: any) => {
    event.preventDefault();
    if (managed) {
      onSearch?.();
      return;
    }
    const normalizedKeyword = normalizeKeyword(currentKeyword);
    if (!normalizedKeyword.isValid) {
      setKeywordError("Please enter at least 1 alphanumeric character.");
      return;
    }
    setKeywordError("");
    updateURL(currentLocation, currentKeyword);
  }

  const handleSkillChipClick = (skill: string) => {
    const params = new URLSearchParams();

    if (isSearchPage) {
      // Keep existing search context, only update skill and reset pagination.
      const existing = new URLSearchParams(searchParams.toString());
      existing.set("skill", skill);
      existing.delete("page");
      router.push(`/search${existing.toString() ? "?" + existing.toString() : ""}`);
      return;
    }

    // From home: carry current inputs and add selected skill.
    if (currentLocation) params.set("location", currentLocation);
    const normalizedKeyword = normalizeKeyword(currentKeyword);
    if (normalizedKeyword.isValid && normalizedKeyword.value) {
      params.set("keyword", normalizedKeyword.value);
    }
    params.set("skill", skill);
    router.push(`/search${params.toString() ? "?" + params.toString() : ""}`);
  };

  const isHomePendingSearch =
    !managed &&
    !isSearchPage &&
    (currentLocation !== location || currentKeyword !== keyword);

  return (
    <>
      <div className="bg-[#000065] py-[60px]">
        <div className="container">
          <h1 className="font-[700] text-[28px] text-white mb-[30px] text-center">
            {(currentTotalJobs !== undefined && currentTotalJobs !== null)
              ? currentTotalJobs
              : (totalJobs === null ? <NumberSkeleton className="bg-white/30" /> : totalJobs)
            } IT Jobs for UIT-ers
          </h1>
          <form 
            className="flex items-start gap-x-[15px] gap-y-[12px] mb-[30px] md:flex-nowrap flex-wrap"
            onSubmit={handleSearch}
          >
            <select 
              name="location" 
              className="md:w-[240px] w-full h-[56px] bg-white rounded-[8px] px-[20px] font-[500] text-[16px] text-[#121212] cursor-pointer shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0088FF]/50 transition-all duration-200"
              value={managed ? (managedLocation ?? "") : currentLocation}
              onChange={handleLocationChange}
            >
              <option value="">All Locations</option>
              {locationList.length > 0 ? (
                locationList.map((c: any) => (
                  <option key={c._id} value={c.slug}>{c.name}</option>
                ))
              ) : (
                // Fallback to a few hardcoded options if fetch fails
                <>
                  <option value="ha-noi">Ha Noi</option>
                  <option value="da-nang">Da Nang</option>
                  <option value="ho-chi-minh">Ho Chi Minh</option>
                </>
              )}
            </select>
            <div className="flex-1">
              <input 
                type="text" 
                name="keyword" 
                placeholder="Job title, company, position, working form..." 
                className="w-full h-[56px] bg-white rounded-[8px] px-[20px] font-[500] text-[16px] text-[#121212] shadow-sm focus:outline-none focus:ring-2 focus:ring-[#0088FF]/50 transition-all duration-200"
                value={managed ? (managedKeyword ?? "") : currentKeyword}
                onChange={handleKeywordChange}
              />
              {(managed ? managedKeywordError : keywordError) && (
                <div className="mt-[8px] flex items-center gap-[8px] text-[14px] text-[#C98900]">
                  <FaTriangleExclamation className="text-[14px]" aria-hidden="true" />
                  <span>{managed ? managedKeywordError : keywordError}</span>
                </div>
              )}
            </div>
            <button className={`md:w-[240px] w-full h-[56px] rounded-[8px] inline-flex items-center justify-center gap-x-[10px] font-[600] text-[16px] text-white cursor-pointer shadow-md transition-all duration-200 active:scale-[0.98] ${
              isHomePendingSearch
                ? "bg-gradient-to-r from-[#0077EE] to-[#0055BB] hover:from-[#006FDE] hover:to-[#004FA8] ring-2 ring-[#8FC5FF]/60"
                : "bg-gradient-to-r from-[#0088FF] to-[#0066CC] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30"
            }`}>
              <FaMagnifyingGlass className="text-[20px]" /> Search
            </button>
          </form>
          <div className="flex flex-wrap gap-x-[12px] gap-y-[15px] items-center">
            <div className="font-[500] text-[16px] text-[#DEDEDE]">
              People are searching:
            </div>
            <div className="flex flex-wrap gap-[10px]">
              {(showAllSkills && allSkills && allSkills.length > 0 ? allSkills : skillList).map((item, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSkillChipClick(item)}
                  className="border border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] py-[8px] px-[22px] font-[500] text-[16px] text-[#DEDEDE] hover:text-white transition-all duration-200"
                >
                  {item}
                </button>
              ))}
              {isSearchPage ? (
                allSkills && allSkills.length > skillList.length ? (
                  <button
                    type="button"
                    onClick={() => setShowAllSkills((prev) => !prev)}
                    className="border border-[#0088FF] bg-transparent hover:bg-[#0088FF] rounded-[20px] py-[8px] px-[22px] font-[500] text-[16px] text-[#0088FF] hover:text-white transition-all duration-200"
                  >
                    {showAllSkills ? "Show less" : "See all →"}
                  </button>
                ) : null
              ) : (
                <Link 
                  href="/search" 
                  className="border border-[#0088FF] bg-transparent hover:bg-[#0088FF] rounded-[20px] py-[8px] px-[22px] font-[500] text-[16px] text-[#0088FF] hover:text-white transition-all duration-200"
                >
                  See all →
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
