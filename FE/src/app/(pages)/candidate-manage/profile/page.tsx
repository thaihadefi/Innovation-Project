import { cookies } from "next/headers";
import { ProfileForm } from "./ProfileForm";

import { getServerApiUrl } from "@/utils/get-server-api-url";

export default async function Page() {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let candidateInfo: any = null;

  try {
    const res = await fetch(`${apiUrl}/auth/check`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (data.code === "success" && data.infoCandidate) {
      candidateInfo = data.infoCandidate;
    }
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
  }

  if (!candidateInfo) {
    return null;
  }

  return (
    <>
      
      <div className="py-[60px]">
        <div className="container">
          <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
            <h1 className="font-[700] text-[20px] text-black mb-[20px]">
              Personal Information
            </h1>
            <ProfileForm initialCandidateInfo={candidateInfo} />
          </div>
        </div>
      </div>
      
    </>
  )
}
