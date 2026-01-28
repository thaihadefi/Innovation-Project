import { SalaryInsightsClient } from "./SalaryInsightsClient";

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
  const API_URL = process.env.API_URL || "http://localhost:4001";

  // Fetch salary insights data on server
  const result = await fetch(`${API_URL}/salary/insights`, {
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
  const byTechnology: SalaryInsight[] = result.code === "success" ? (result.byTechnology || []) : [];
  const byCity: SalaryInsight[] = result.code === "success" ? (result.byCity || []) : [];

  return (
    <SalaryInsightsClient 
      overview={overview}
      byPosition={byPosition}
      byTechnology={byTechnology}
      byCity={byCity}
    />
  );
}
