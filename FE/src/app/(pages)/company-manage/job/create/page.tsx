import Link from "next/link";
import { FormCreate } from "./FormCreate";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";

import { getServerApiUrl } from "@/utils/get-server-api-url";
import type { LocationOption } from "@/types/common";

export default async function Page() {
  let locationList: LocationOption[] = [];
  const apiUrl = getServerApiUrl();

  try {
    const res = await fetch(`${apiUrl}/location`, {
      cache: "no-store"
    });
    const data = await res.json();

    if (data.code === "success") {
      locationList = sortLocationsWithOthersLast<LocationOption>(data.locationList);
    }
  } catch (error) {
    console.error("Failed to fetch locations:", error);
  }

  return (
    <>
      
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="flex flex-wrap gap-[20px] items-center justify-between mb-[20px]">
              <h1 className="w-[100%] sm:w-auto font-[700] text-[20px] text-black">
                Create New Job
              </h1>
              <Link
                href="/company-manage/job/list"
                className="font-[400] text-[14px] text-[#0088FF] underline"
              >
                Back to List
              </Link>
            </div>
            <FormCreate initialCityList={locationList} />
          </div>
        </div>
      </div>
      
    </>
  )
}
