import { SalaryInsightsClient } from "./SalaryInsightsClient";
import { getServerApiUrl } from "@/utils/get-server-api-url";

interface SalaryInsight {
  category: string;
  slug?: string;
  type: string;
  jobCount: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

interface Overview {
  totalJobs: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

export default async function SalaryInsightsPage() {
  const apiUrl = getServerApiUrl();

  // Fetch salary insights data on server
  const result = await fetch(`${apiUrl}/salary/insights`, {
    method: "GET",
    cache: "no-store"
  }).then(res => res.json()).catch(() => ({ code: "error" }));

  // Process data
  const overview: Overview = result.code === "success" && result.overall ? result.overall : {
    totalJobs: 0,
    avgSalary: 0,
    minSalary: 0,
    maxSalary: 0
  };

  const byPosition: SalaryInsight[] = result.code === "success" ? (result.byPosition || []) : [];
  const bySkill: SalaryInsight[] = result.code === "success" ? (result.bySkill || []) : [];
  const byLocation: SalaryInsight[] = result.code === "success" ? (result.byLocation || []) : [];

  return (
    <SalaryInsightsClient 
      overview={overview}
      byPosition={byPosition}
      bySkill={bySkill}
      byLocation={byLocation}
    />
  );
}
