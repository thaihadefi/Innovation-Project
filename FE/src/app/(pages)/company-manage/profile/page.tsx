import { cookies } from "next/headers";
import { ProfileForm } from "./ProfileForm";

export default async function CompanyManagerProfilePage() {
  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let companyInfo: any = null;
  let cityList: any[] = [];
  let followerCount: number = 0;

  try {
    // Fetch auth check (for company info), cities, and follower count in parallel
    const [authRes, cityRes, followerRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store"
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/list`, {
        cache: "no-store"
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/follower-count`, {
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
    // Layout already handles auth redirect, no need to redirect here

    if (cityData.code === "success") {
      cityList = cityData.cityList.sort((a: any, b: any) => 
        a.name.localeCompare(b.name, 'vi')
      );
    }

    if (followerData.code === "success") {
      followerCount = followerData.followerCount;
    }
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
    // Layout already handles auth redirect
  }

  // If somehow companyInfo is null (shouldn't happen if layout works), return null
  if (!companyInfo) {
    return null;
  }

  return (
    <>
      {/* Company Information */}
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
            <h2 className="font-[700] text-[20px] text-black mb-[20px]">
              Company Information
            </h2>
            <ProfileForm 
              initialCompanyInfo={companyInfo} 
              initialCityList={cityList}
              initialFollowerCount={followerCount}
            />
          </div>
        </div>
      </div>
      {/* End Company Information */}
    </>
  )
}
