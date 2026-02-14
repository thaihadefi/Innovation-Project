import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { FormEdit } from "./FormEdit";
import { sortCitiesWithOthersLast } from "@/utils/citySort";

export default async function Page(props: PageProps<'/company-manage/job/edit/[id]'>) {
  const { id } = await props.params;

  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let jobDetail: any = null;
  let cityList: any[] = [];

  try {
    // Fetch job details and cities in parallel
    const [jobRes, cityRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/job/edit/${id}`, {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store"
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/city`, {
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
      cityList = sortCitiesWithOthersLast(cityData.cityList);
    }
  } catch (error) {
    console.error("Failed to fetch job data:", error);
    redirect("/company-manage/job/list");
  }

  return (
    <>
      {/* Edit Job */}
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
            <FormEdit id={id} initialJobDetail={jobDetail} initialCityList={cityList} />
          </div>
        </div>
      </div>
      {/* End Edit Job */}
    </>
  )
}
