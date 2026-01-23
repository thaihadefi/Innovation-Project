/* eslint-disable @typescript-eslint/no-explicit-any */
import { CardCompanyItem } from "@/app/components/card/CardCompanyItem";
import { paginationConfig } from "@/configs/variable";

// Server-side data fetching with ISR (Incremental Static Regeneration)
async function getTopCompanies() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/company/list?limitItems=${paginationConfig.homeTopEmployers}`,
      {
        next: { revalidate: 60 } // Revalidate every 60 seconds (ISR)
      }
    );
    const data = await res.json();
    if (data.code === "success") {
      return data.companyList || [];
    }
    return [];
  } catch {
    return [];
  }
}

// Server Component - no "use client" directive
export const Section2 = async () => {
  const companyList = await getTopCompanies();

  return (
    <>
      <div className="py-[60px]">
        <div className="container">
          <h2 className="text-center font-[700] sm:text-[28px] text-[24px] text-[#121212] mb-[30px]">
            Top Employers
          </h2>
          {companyList.length === 0 ? (
            <p className="text-center text-gray-500">No companies found</p>
          ) : (
            <div className="grid lg:grid-cols-3 grid-cols-2 sm:gap-x-[20px] gap-x-[10px] gap-y-[20px]">
              {companyList.map((item: any, index: number) => (
                <CardCompanyItem
                  key={item._id || `company-${index}`}
                  item={item}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}