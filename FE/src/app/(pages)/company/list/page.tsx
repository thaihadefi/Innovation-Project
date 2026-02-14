import { Section2 } from "./Section2";
import { sortCitiesWithOthersLast } from "@/utils/citySort";
import { paginationConfig } from "@/configs/variable";

type CompanyListPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CompanyListPage({ searchParams }: CompanyListPageProps) {
  const params = await searchParams;
  const keyword = params.keyword as string || "";
  const location = params.location as string || "";
  const page = params.page as string || "1";

  const API_URL = process.env.API_URL || "http://localhost:4001";

  // Fetch initial data on server
  const [companiesResult, citiesResult] = await Promise.all([
    fetch(`${API_URL}/company/list?limitItems=${paginationConfig.companyList}&page=${page}&keyword=${keyword}&location=${location}`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" })),
    
    fetch(`${API_URL}/city`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" }))
  ]);

  // Process companies
  const initialCompanies = companiesResult.code === "success" ? (companiesResult.companyList || []) : [];
  const initialTotalPage = companiesResult.code === "success" ? (companiesResult.totalPage || 0) : 0;
  const initialTotalRecord = companiesResult.code === "success" ? (companiesResult.totalRecord || 0) : 0;

  // Process cities
  let initialCities: any[] = [];
  if (citiesResult.code === "success") {
    initialCities = sortCitiesWithOthersLast(citiesResult.cityList);
  }

  return (
    <>
      {/* Section 2 */}
      <Section2 
        initialCompanies={initialCompanies}
        initialTotalPage={initialTotalPage}
        initialTotalRecord={initialTotalRecord}
        initialCities={initialCities}
      />
      {/* End Section 2 */}
    </>
  )
}
