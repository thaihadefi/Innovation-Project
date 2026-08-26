import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FormEdit } from "./FormEdit";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";

import { getServerApiUrl } from "@/utils/get-server-api-url";

export default async function Page(props: PageProps<'/company-manage/job/edit/[id]'>) {
  const { id } = await props.params;

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let jobDetail: any = null;
  let locationList: any[] = [];

  try {
    const [jobRes, cityRes] = await Promise.all([
      fetch(`${apiUrl}/company/job/edit/${id}`, {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store"
      }),
      fetch(`${apiUrl}/location`, {
        cache: "no-store"
      })
    ]);

    const [jobData, cityData] = await Promise.all([
      jobRes.json(),
      cityRes.json()
    ]);

    if (jobData.code === "success") {
      jobDetail = jobData.jobDetail;
    } else {
      redirect("/company-manage/job/list");
    }

    if (cityData.code === "success") {
      locationList = sortLocationsWithOthersLast(cityData.locationList);
    }
  } catch (error) {
    console.error("Failed to fetch job data:", error);
    redirect("/company-manage/job/list");
  }

  return (
    <>
      
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <div className="flex flex-wrap gap-[20px] items-center justify-between mb-[20px]">
              <h1 className="w-[100%] sm:w-auto font-[700] text-[20px] text-black">
                Edit Job
              </h1>
              <Link
                href="/company-manage/job/list"
                className="font-[400] text-[14px] text-[#0088FF] underline"
              >
                Back to List
              </Link>
            </div>
            <FormEdit id={id} initialJobDetail={jobDetail} initialCityList={locationList} />
          </div>
        </div>
      </div>
      
    </>
  )
}
