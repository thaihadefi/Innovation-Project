import { Section1 } from "@/app/components/section/Section1";
import { RecommendedJobs } from "./RecommendedJobs";
import { Section2 } from "./Section2";
import { sortCitiesWithOthersLast } from "@/utils/citySort";

export default async function HomePage() {
  const apiUrl = process.env.API_URL || "http://localhost:4001";
  
  // Fetch auth status on server
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  let serverAuth = null;
  let recommendationsData: any[] = [];
  
  // Fetch all data in parallel
  const [authResult, totalJobsResult, companiesResult, technologiesResult, citiesResult] = await Promise.all([
    // Fetch auth
    token
      ? fetch(`${apiUrl}/auth/check`, {
          headers: { Cookie: `token=${token}` },
          cache: "no-store"
        })
          .then(res => res.json())
          .catch(() => ({ code: "error" }))
      : Promise.resolve({ code: "error" }),
    
    // Fetch total jobs
    fetch(`${apiUrl}/search`, { 
      method: "GET",
      cache: "no-store" 
    })
      .then(res => res.json())
      .catch(() => ({ code: "error" })),
    
    // Fetch top companies
    fetch(`${apiUrl}/company/list?limitItems=${6}`, {
      cache: "no-store"
    })
      .then(res => res.json())
      .catch(() => ({ code: "error" })),
    
    // Fetch top technologies
    fetch(`${apiUrl}/job/technologies`, {
      cache: "no-store"
    })
      .then(res => res.json())
      .catch(() => ({ code: "error" })),
    
    // Fetch cities
    fetch(`${apiUrl}/city`, {
      cache: "no-store"
    })
      .then(res => res.json())
      .catch(() => ({ code: "error" }))
  ]);
  
  // Process auth result
  if (authResult.code === "success") {
    serverAuth = {
      infoCandidate: authResult.infoCandidate || null,
      infoCompany: authResult.infoCompany || null
    };
    
    // If logged in as candidate, fetch recommendations
    if (authResult.infoCandidate && token) {
      try {
        const recRes = await fetch(`${apiUrl}/candidate/recommendations`, {
          headers: { Cookie: `token=${token}` },
          cache: "no-store"
        });
        const recData = await recRes.json();
        if (recData.code === "success" && recData.recommendations?.length > 0) {
          recommendationsData = recData.recommendations.slice(0, 6);
        }
      } catch {
        // Failed to fetch recommendations
      }
    }
  }
  
  // Process total jobs
  const totalJobs = totalJobsResult.code === "success"
    ? totalJobsResult.pagination?.totalRecord || totalJobsResult.jobs?.length || 0
    : 0;
  
  // Process companies
  const topCompanies = companiesResult.code === "success"
    ? companiesResult.companyList || []
    : [];
  
  // Process technologies
  const toSlug = (s: any) => s?.toString().toLowerCase().trim()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '') || '';
  
  let topLanguages: string[] = [];
  if (technologiesResult.code === "success") {
    const top5 = (technologiesResult.topTechnologies && Array.isArray(technologiesResult.topTechnologies))
      ? technologiesResult.topTechnologies.map((item: any) => item.slug || toSlug(item.name))
      : [];
    const fallback = (technologiesResult.technologiesWithSlug && Array.isArray(technologiesResult.technologiesWithSlug))
      ? technologiesResult.technologiesWithSlug.map((it: any) => it.slug || toSlug(it.name)).slice(0, 5)
      : (Array.isArray(technologiesResult.technologies) ? technologiesResult.technologies.map((n: any) => toSlug(n)).slice(0, 5) : []);
    topLanguages = top5.length > 0 ? top5 : fallback;
  }
  if (topLanguages.length === 0) {
    topLanguages = ["html5", "css3", "javascript", "reactjs", "nodejs"];
  }
  
  // Process cities
  let cityList: any[] = [];
  if (citiesResult.code === "success") {
    cityList = sortCitiesWithOthersLast(citiesResult.cityList);
  }

  return (
    <>
      {/* Section 1 */}
      <Section1 
        initialTotalJobs={totalJobs} 
        initialLanguages={topLanguages}
        initialCities={cityList}
      />
      {/* End Section 1 */}

      {/* Recommended Jobs - Shows only for logged-in candidates WITH recommendations */}
      {recommendationsData.length > 0 && <RecommendedJobs serverAuth={serverAuth} initialRecommendations={recommendationsData} />}
      {/* End Recommended Jobs */}

      {/* Section 2 - Server-side rendered with data */}
      <Section2 companies={topCompanies} />
      {/* End Section 2 */}
    </>
  );
}
