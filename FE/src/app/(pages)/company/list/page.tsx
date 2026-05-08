import { Section2 } from "./Section2";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";
import { paginationConfig } from "@/configs/variable";
import { getServerApiUrl } from "@/utils/get-server-api-url";

type CompanyListPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CompanyListPage({ searchParams }: CompanyListPageProps) {
  const params = await searchParams;
  const keyword = params.keyword as string || "";
  const location = params.location as string || "";
  const page = params.page as string || "1";

  const apiUrl = getServerApiUrl();

  // Fetch initial data on server
  const companyListQuery = new URLSearchParams();
  companyListQuery.set("limitItems", String(paginationConfig.companyList));
  companyListQuery.set("page", page);
  if (keyword) companyListQuery.set("keyword", keyword);
  if (location) companyListQuery.set("location", location);

  const [companiesResult, locationsResult] = await Promise.all([
    fetch(`${apiUrl}/company/list?${companyListQuery.toString()}`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" })),
    
    fetch(`${apiUrl}/location`, {
      method: "GET",
      cache: "no-store"
    }).then(res => res.json()).catch(() => ({ code: "error" }))
  ]);

  // Process companies
  const initialCompanies = companiesResult.code === "success" ? (companiesResult.companyList || []) : [];
  const initialTotalPage = companiesResult.code === "success" ? (companiesResult.totalPage || 0) : 0;
  const initialTotalRecord = companiesResult.code === "success" ? (companiesResult.totalRecord || 0) : 0;

  // Process locations
  let initialLocations: any[] = [];
  if (locationsResult.code === "success") {
    initialLocations = sortLocationsWithOthersLast(locationsResult.locationList);
  }

  return (
    <>
      {/* Section 2 */}
      <Section2 
        initialCompanies={initialCompanies}
        initialTotalPage={initialTotalPage}
        initialTotalRecord={initialTotalRecord}
        initialLocations={initialLocations}
      />
      {/* End Section 2 */}
    </>
  )
}
