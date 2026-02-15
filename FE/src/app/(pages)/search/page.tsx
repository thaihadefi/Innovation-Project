import { SearchContainer } from "./SearchContainer";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";
import { paginationConfig } from "@/configs/variable";

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const skill = params.skill as string || "";
  const location = params.location as string || "";
  const company = params.company as string || "";
  const keyword = params.keyword as string || "";
  const position = params.position as string || "";
  const workingForm = params.workingForm as string || "";
  const page = params.page as string || "1";

  const API_URL = process.env.API_URL || "http://localhost:4001";

  // Fetch initial data on server
  const toSlug = (s: any) => s?.toString().toLowerCase().trim()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '') || '';

  const searchQuery = new URLSearchParams();
  if (skill) searchQuery.set("skill", skill);
  if (location) searchQuery.set("location", location);
  if (company) searchQuery.set("company", company);
  if (keyword) searchQuery.set("keyword", keyword);
  if (position) searchQuery.set("position", position);
  if (workingForm) searchQuery.set("workingForm", workingForm);
  searchQuery.set("page", page);
  searchQuery.set("limit", String(paginationConfig.searchResults));

  const [jobsResult, skillsResult, locationsResult] = await Promise.all([
    fetch(`${API_URL}/search?${searchQuery.toString()}`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" })),
    
    fetch(`${API_URL}/job/skills`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" })),
    
    fetch(`${API_URL}/location`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" }))
  ]);

  // Process jobs
  const initialJobs = jobsResult.code === "success" ? (jobsResult.jobs || []) : [];
  const initialTotalRecord = jobsResult.code === "success" ? (jobsResult.pagination?.totalRecord || 0) : 0;
  const initialTotalPage = jobsResult.code === "success" ? (jobsResult.pagination?.totalPage || 1) : 1;
  const initialCurrentPage = jobsResult.code === "success" ? (jobsResult.pagination?.currentPage || 1) : 1;

  // Process skills - full list for dropdown + top list for "People are searching"
  let initialAllSkills: string[] = [];
  let initialTopSkills: string[] = [];
  if (skillsResult.code === "success") {
    const fullWithSlug = (skillsResult.skillsWithSlug && Array.isArray(skillsResult.skillsWithSlug))
      ? skillsResult.skillsWithSlug.map((it: any) => it.slug || toSlug(it.name))
      : [];
    const fullRaw = Array.isArray(skillsResult.skills)
      ? skillsResult.skills.map((n: any) => toSlug(n))
      : [];
    const topFallback = (skillsResult.topSkills && Array.isArray(skillsResult.topSkills))
      ? skillsResult.topSkills.map((item: any) => item.slug || toSlug(item.name))
      : [];
    initialAllSkills = fullWithSlug.length > 0 ? fullWithSlug : (fullRaw.length > 0 ? fullRaw : topFallback);
    initialTopSkills = topFallback.length > 0 ? topFallback : initialAllSkills.slice(0, paginationConfig.topSkills);
  }
  if (initialAllSkills.length === 0) {
    initialAllSkills = ["html5", "css3", "javascript", "reactjs", "nodejs"];
  }
  if (initialTopSkills.length === 0) {
    initialTopSkills = initialAllSkills.slice(0, paginationConfig.topSkills);
  }

  // Process locations
  let initialLocations: any[] = [];
  if (locationsResult.code === "success") {
    initialLocations = sortLocationsWithOthersLast(locationsResult.locationList);
  }

  // Compute selected location server-side to avoid client flash when slug contains suffixes
  let initialSelectedLocation: any = null;
  if (location && initialLocations.length > 0) {
    const locationSlug = toSlug(location);
    const suffixMatch = locationSlug.match(/-(?:[a-f0-9]{6})$/i);
    const baseLocation = suffixMatch ? locationSlug.replace(/-(?:[a-f0-9]{6})$/i, '') : locationSlug;

    // Try exact slug match first
    let found = initialLocations.find((c: any) => c.slug === locationSlug || c.slug === baseLocation);

    // Fallback: allow matching when DB slugs have a short suffix or base startsWith
    if (!found) {
      found = initialLocations.find((c: any) => c.slug && (c.slug.startsWith(locationSlug) || c.slug.startsWith(baseLocation) || locationSlug.startsWith(c.slug)));
    }

    // Fallback: match by normalized name
    if (!found) {
      const normLocation = baseLocation.replace(/-+$/g, '');
      found = initialLocations.find((c: any) => {
        const n = toSlug(c.name);
        return n === normLocation || n.includes(normLocation) || (c.slug && c.slug.includes(normLocation));
      });
    }

    initialSelectedLocation = found || null;
  }

  return (
    <SearchContainer 
      initialJobs={initialJobs}
      initialTotalRecord={initialTotalRecord}
      initialTotalPage={initialTotalPage}
      initialCurrentPage={initialCurrentPage}
      initialSkills={initialTopSkills}
      initialAllSkills={initialAllSkills}
      initialLocations={initialLocations}
      initialSelectedLocation={initialSelectedLocation}
    />
  );
}
