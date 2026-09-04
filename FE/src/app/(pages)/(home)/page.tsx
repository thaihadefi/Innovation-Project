import { Section1 } from "@/app/components/section/Section1";
import { RecommendedJobs } from "./RecommendedJobs";
import { Section2 } from "./Section2";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";
import { paginationConfig } from "@/configs/variable";
import { getServerApiUrl } from "@/utils/get-server-api-url";
import type { ServerAuth } from "@/types/auth";
import type { JobCard } from "@/types/job";
import type { LocationOption, SkillItem } from "@/types/common";

export default async function HomePage() {
  const apiUrl = getServerApiUrl();
  
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  let serverAuth: ServerAuth = null;
  let recommendationsData: JobCard[] = [];
  
  const [authResult, totalJobsResult, companiesResult, skillsResult, locationsResult] = await Promise.all([
    token
      ? fetch(`${apiUrl}/auth/check`, {
          headers: { Cookie: `token=${token}` },
          cache: "no-store"
        })
          .then(res => res.json())
          .catch(() => ({ code: "error" }))
      : Promise.resolve({ code: "error" }),
    
    fetch(`${apiUrl}/search`, { 
      method: "GET",
      cache: "no-store" 
    })
      .then(res => res.json())
      .catch(() => ({ code: "error" })),
    
    fetch(`${apiUrl}/company/list?limitItems=${paginationConfig.homeTopCompanies}`, {
      cache: "no-store"
    })
      .then(res => res.json())
      .catch(() => ({ code: "error" })),
    
    fetch(`${apiUrl}/job/skills`, {
      cache: "no-store"
    })
      .then(res => res.json())
      .catch(() => ({ code: "error" })),
    
    fetch(`${apiUrl}/location`, {
      cache: "no-store"
    })
      .then(res => res.json())
      .catch(() => ({ code: "error" }))
  ]);
  
  if (authResult.code === "success") {
    serverAuth = {
      infoCandidate: authResult.infoCandidate || null,
      infoCompany: authResult.infoCompany || null
    };
    
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
      } catch { /* keep fallback values on error */ }
    }
  }
  
  const totalJobs = totalJobsResult.code === "success"
    ? totalJobsResult.pagination?.totalRecord || totalJobsResult.jobs?.length || 0
    : 0;
  
  const topCompanies = companiesResult.code === "success"
    ? companiesResult.companyList || []
    : [];
  
  const toSlug = (s: unknown) => String(s ?? "").toLowerCase().trim()
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9\-]/g, '') || '';

  let topSkills: string[] = [];
  if (skillsResult.code === "success") {
    const top5 = (skillsResult.topSkills && Array.isArray(skillsResult.topSkills))
      ? skillsResult.topSkills.map((item: SkillItem) => item.slug || toSlug(item.name))
      : [];
    const fallback = (skillsResult.skillsWithSlug && Array.isArray(skillsResult.skillsWithSlug))
      ? skillsResult.skillsWithSlug.map((it: SkillItem) => it.slug || toSlug(it.name)).slice(0, paginationConfig.topSkills)
      : (Array.isArray(skillsResult.skills) ? skillsResult.skills.map((n: unknown) => toSlug(n)).slice(0, paginationConfig.topSkills) : []);
    topSkills = top5.length > 0 ? top5 : fallback;
  }
  if (topSkills.length === 0) {
    topSkills = ["html5", "css3", "javascript", "reactjs", "nodejs"];
  }
  
  let locationList: LocationOption[] = [];
  if (locationsResult.code === "success") {
    locationList = sortLocationsWithOthersLast<LocationOption>(locationsResult.locationList);
  }

  return (
    <>
      
      <Section1 
        initialTotalJobs={totalJobs} 
        initialSkills={topSkills}
        initialLocations={locationList}
      />
      

      
      {recommendationsData.length > 0 && <RecommendedJobs serverAuth={serverAuth} initialRecommendations={recommendationsData} />}
      

      
      <Section2 companies={topCompanies} />
      
    </>
  );
}
