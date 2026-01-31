import Link from "next/link";
import { FormCreate } from "./FormCreate";
import { sortCitiesWithOthersLast } from "@/utils/citySort";

export default async function Page() {
  // Fetch cities on server
  let cityList: any[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/city`, {
      cache: "no-store"
    });
    const data = await res.json();

    if (data.code === "success") {
      cityList = sortCitiesWithOthersLast(data.cityList);
    }
  } catch (error) {
    console.error("Failed to fetch cities:", error);
  }

  return (
    <>
      {/* Create New Job */}
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="flex flex-wrap gap-[20px] items-center justify-between mb-[20px]">
              <h1 className="sm:w-auto w-[100%] font-[700] text-[20px] text-black">
                Create New Job
              </h1>
              <Link
                href="/company-manage/job/list"
                className="font-[400] text-[14px] text-[#0088FF] underline"
              >
                Back to List
              </Link>
            </div>
            <FormCreate initialCityList={cityList} />
          </div>
        </div>
      </div>
      {/* End Create New Job */}
    </>
  )
}
