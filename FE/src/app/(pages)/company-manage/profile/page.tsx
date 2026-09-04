import { cookies } from "next/headers";
import { ProfileForm } from "./ProfileForm";
import { sortLocationsWithOthersLast } from "@/utils/locationSort";

import { getServerApiUrl } from "@/utils/get-server-api-url";

export default async function CompanyManagerProfilePage() {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let companyInfo: any = null;
  let locationList: any[] = [];
  let followerCount: number = 0;

  try {
    const [authRes, cityRes, followerRes] = await Promise.all([
      fetch(`${apiUrl}/auth/check`, {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store"
      }),
      fetch(`${apiUrl}/location/list`, {
        cache: "no-store"
      }),
      fetch(`${apiUrl}/company/follower-count`, {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store"
      })
    ]);

    const [authData, cityData, followerData] = await Promise.all([
      authRes.json(),
      cityRes.json(),
      followerRes.json()
    ]);

    if (authData.code === "success" && authData.infoCompany) {
      companyInfo = authData.infoCompany;
    }

    if (cityData.code === "success") {
      locationList = sortLocationsWithOthersLast(cityData.locationList);
    }

    if (followerData.code === "success") {
      followerCount = followerData.followerCount;
    }
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
  }

  if (!companyInfo) {
    return null;
  }

  return (
    <>
      
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
            <h2 className="font-[700] text-[20px] text-black mb-[20px]">
              Company Information
            </h2>
            <ProfileForm 
              initialCompanyInfo={companyInfo} 
              initialCityList={locationList}
              initialFollowerCount={followerCount}
            />
          </div>
        </div>
      </div>
      
    </>
  )
}
