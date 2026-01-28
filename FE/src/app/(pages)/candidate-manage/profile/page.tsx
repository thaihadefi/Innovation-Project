import { cookies } from "next/headers";
import { ProfileForm } from "./ProfileForm";

export default async function Page() {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let candidateInfo: any = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });

    const data = await res.json();

    if (data.code === "success" && data.infoCandidate) {
      candidateInfo = data.infoCandidate;
    }
    // Layout already handles auth redirect, no need to redirect here
  } catch (error) {
    console.error("Failed to fetch profile data:", error);
  }

  // If somehow candidateInfo is null (shouldn't happen if layout works), return null
  if (!candidateInfo) {
    return null;
  }

  return (
    <>
      {/* Personal Information */}
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
      {/* End Personal Information */}
    </>
  )
}
