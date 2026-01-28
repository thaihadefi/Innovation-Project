import { SearchContainer } from "./SearchContainer";

type SearchPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const language = params.language as string || "";
  const city = params.city as string || "";
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

  const [jobsResult, technologiesResult, citiesResult] = await Promise.all([
    fetch(`${API_URL}/search?language=${language}&city=${city}&company=${company}&keyword=${keyword}&position=${position}&workingForm=${workingForm}&page=${page}&limit=9`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" })),
    
    fetch(`${API_URL}/job/technologies`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" })),
    
    fetch(`${API_URL}/city`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" }))
  ]);

  // Process jobs
  const initialJobs = jobsResult.code === "success" ? (jobsResult.jobs || []) : [];
  const initialTotalRecord = jobsResult.code === "success" ? (jobsResult.pagination?.totalRecord || 0) : 0;
  const initialTotalPage = jobsResult.code === "success" ? (jobsResult.pagination?.totalPage || 1) : 1;
  const initialCurrentPage = jobsResult.code === "success" ? (jobsResult.pagination?.currentPage || 1) : 1;

  // Process technologies - only get top 5 like homepage
  let initialLanguages: string[] = [];
  if (technologiesResult.code === "success") {
    const top5 = (technologiesResult.topTechnologies && Array.isArray(technologiesResult.topTechnologies))
      ? technologiesResult.topTechnologies.map((item: any) => item.slug || toSlug(item.name))
      : [];
    const fallback = (technologiesResult.technologiesWithSlug && Array.isArray(technologiesResult.technologiesWithSlug))
      ? technologiesResult.technologiesWithSlug.map((it: any) => it.slug || toSlug(it.name)).slice(0, 5)
      : (Array.isArray(technologiesResult.technologies) ? technologiesResult.technologies.map((n: any) => toSlug(n)).slice(0, 5) : []);
    initialLanguages = top5.length > 0 ? top5 : fallback;
  }
  if (initialLanguages.length === 0) {
    initialLanguages = ["html5", "css3", "javascript", "reactjs", "nodejs"];
  }

  // Process cities
  let initialCities: any[] = [];
  if (citiesResult.code === "success") {
    initialCities = citiesResult.cityList.sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi'));
  }

  // Compute selected city server-side to avoid client flash when slug contains suffixes
  let initialSelectedCity: any = null;
  if (city && initialCities.length > 0) {
    const citySlug = toSlug(city);
    const suffixMatch = citySlug.match(/-(?:[a-f0-9]{6})$/i);
    const baseCity = suffixMatch ? citySlug.replace(/-(?:[a-f0-9]{6})$/i, '') : citySlug;

    // Try exact slug match first
    let found = initialCities.find((c: any) => c.slug === citySlug || c.slug === baseCity);

    // Fallback: allow matching when DB slugs have a short suffix or base startsWith
    if (!found) {
      found = initialCities.find((c: any) => c.slug && (c.slug.startsWith(citySlug) || c.slug.startsWith(baseCity) || citySlug.startsWith(c.slug)));
    }

    // Fallback: match by normalized name
    if (!found) {
      const normCity = baseCity.replace(/-+$/g, '');
      found = initialCities.find((c: any) => {
        const n = toSlug(c.name);
        return n === normCity || n.includes(normCity) || (c.slug && c.slug.includes(normCity));
      });
    }

    initialSelectedCity = found || null;
  }

  return (
    <SearchContainer 
      initialJobs={initialJobs}
      initialTotalRecord={initialTotalRecord}
      initialTotalPage={initialTotalPage}
      initialCurrentPage={initialCurrentPage}
      initialLanguages={initialLanguages}
      initialCities={initialCities}
      initialSelectedCity={initialSelectedCity}
    />
  );
}

