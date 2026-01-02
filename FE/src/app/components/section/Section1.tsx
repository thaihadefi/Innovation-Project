/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { useEffect, useState, useRef, useCallback } from "react";
import { NumberSkeleton } from "@/app/components/ui/Skeleton";

export const Section1 = (props: {
  city?: string,
  keyword?: string
}) => {
  const { city = "", keyword = "" } = props;

  const [languageList, setLanguageList] = useState<string[]>([]);
  const [cityList, setCityList] = useState<any[]>([]);
  const [totalJobs, setTotalJobs] = useState<number | null>(null); // null = loading
  const [currentCity, setCurrentCity] = useState(city);
  const [currentKeyword, setCurrentKeyword] = useState(keyword);

  const router = useRouter();

  useEffect(() => {
    // Fetch total job count
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/search`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
        if(data.code === "success") {
          setTotalJobs(data.jobs?.length || 0);
        }
      })
      .catch(() => {
        setTotalJobs(0); // Fallback to 0 on error
      });

    // Fetch technologies/languages - get top 5 popular ones
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/technologies`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
        if(data.code === "success") {
          // small client-side slug generator as a safe fallback
          const toSlug = (s: any) => s?.toString().toLowerCase().trim()
            .normalize('NFD').replace(/\p{Diacritic}/gu, '')
            .replace(/\s+/g, '-')
            .replace(/[^a-z0-9\-]/g, '') || '';

          // Prefer the canonical slug values returned by the API
          const top5 = (data.topTechnologies && Array.isArray(data.topTechnologies))
            ? data.topTechnologies.map((item: any) => item.slug || toSlug(item.name))
            : [];

          const fallback = (data.technologiesWithSlug && Array.isArray(data.technologiesWithSlug))
            ? data.technologiesWithSlug.map((it: any) => it.slug || toSlug(it.name)).slice(0, 5)
            : (Array.isArray(data.technologies) ? data.technologies.map((n: any) => toSlug(n)).slice(0,5) : []);

          setLanguageList(top5.length > 0 ? top5 : fallback);
        }
      }).catch(() => {
        // Fallback to hardcoded list if fetch fails
        setLanguageList(["html5", "css3", "javascript", "reactjs", "nodejs"]);
      })

    // Fetch cities so the select shows labels while values are slugs
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/city`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
        if(data.code === "success") {
          const sorted = data.cityList.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
          setCityList(sorted);
        }
      }).catch(() => {
        // ignore fetch errors here; select will fallback to hardcoded options
      })
  }, []);

  // Sync state with props when they change (e.g., when navigating)
  useEffect(() => {
    setCurrentCity(city);
    setCurrentKeyword(keyword);
  }, [city, keyword]);

  const updateURL = (cityValue: string, keywordValue: string) => {
    const params = new URLSearchParams();
    if(cityValue) params.set("city", cityValue);
    if(keywordValue) params.set("keyword", keywordValue);
    router.push(`/search${params.toString() ? '?' + params.toString() : ''}`);
  }

  // Debounce timer ref for keyword input
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const handleCityChange = (event: any) => {
    const value = event.target.value;
    setCurrentCity(value);
    // City change updates URL immediately
    updateURL(value, currentKeyword);
  }

  const handleKeywordChange = (event: any) => {
    const value = event.target.value;
    setCurrentKeyword(value);
    
    // Debounce URL update for keyword (300ms)
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      updateURL(currentCity, value);
    }, 300);
  }

  const handleSearch = (event: any) => {
    event.preventDefault();
    updateURL(currentCity, currentKeyword);
  }

  return (
    <>
      <div className="bg-[#000065] py-[60px]">
        <div className="container">
          <h1 className="font-[700] text-[28px] text-white mb-[30px] text-center">
            {totalJobs === null ? <NumberSkeleton className="bg-white/30" /> : totalJobs} IT Jobs for UIT-ers
          </h1>
          <form 
            className="flex gap-x-[15px] gap-y-[12px] mb-[30px] md:flex-nowrap flex-wrap"
            onSubmit={handleSearch}
          >
            <select 
              name="city" 
              className="md:w-[240px] w-full h-[56px] bg-white rounded-[4px] px-[20px] font-[500] text-[16px] text-[#121212]"
              value={currentCity}
              onChange={handleCityChange}
            >
              <option value="">All Cities</option>
              {cityList.length > 0 ? (
                cityList.map((c: any) => (
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
            <input 
              type="text" 
              name="keyword" 
              placeholder="Job title, company, position, working form..." 
              className="flex-1 h-[56px] bg-white rounded-[4px] px-[20px] font-[500] text-[16px] text-[#121212]"
              value={currentKeyword}
              onChange={handleKeywordChange}
            />
            <button className="md:w-[240px] w-full h-[56px] bg-[#0088FF] rounded-[4px] inline-flex items-center justify-center gap-x-[10px] font-[500] text-[16px] text-white">
              <FaMagnifyingGlass className="text-[20px]" /> Search
            </button>
          </form>
          <div className="flex flex-wrap gap-x-[12px] gap-y-[15px] items-center">
            <div className="font-[500] text-[16px] text-[#DEDEDE]">
              People are searching:
            </div>
            <div className="flex flex-wrap gap-[10px]">
              {languageList.map((item, index) => (
                <Link 
                  key={index}
                  href={`/search?language=${item}`} 
                  className="border border-[#414042] bg-[#121212] hover:bg-[#414042] rounded-[20px] py-[8px] px-[22px] font-[500] text-[16px] text-[#DEDEDE] hover:text-white"
                >
                  {item}
                </Link>
              ))}
              <Link 
                href="/search" 
                className="border border-[#0088FF] bg-transparent hover:bg-[#0088FF] rounded-[20px] py-[8px] px-[22px] font-[500] text-[16px] text-[#0088FF] hover:text-white"
              >
                See all →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}