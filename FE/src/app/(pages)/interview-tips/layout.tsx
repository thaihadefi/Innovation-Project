import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { InterviewTipsLayoutClient } from "./InterviewTipsLayoutClient";

export default async function InterviewTipsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();

    if (data.code !== "success" || !data.infoCandidate) {
      redirect("/candidate/login");
    }

    if (!data.infoCandidate?.isVerified) {
      return (
        <div className="mx-auto w-full max-w-[1200px] px-[16px] py-[40px]">
          <div className="text-center py-[30px] border border-[#FF6B6B] rounded-[8px] bg-[#fff0f0]">
            <h3 className="font-[700] text-[18px] text-[#c92a2a] mb-[8px]">
              Verification Required
            </h3>
            <p className="text-[#c92a2a] text-[14px] mb-[16px]">
              Only verified UIT students and alumni can access Interview Tips.<br />
              Please complete your profile (Full Name, Student ID, Cohort, Major) to get verified.
            </p>
            <Link
              href="/candidate-manage/profile"
              className="inline-block bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[24px] py-[12px] rounded-[8px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
            >
              Go to Profile
            </Link>
          </div>
        </div>
      );
    }
  } catch {
    redirect("/candidate/login");
  }

  return <InterviewTipsLayoutClient>{children}</InterviewTipsLayoutClient>;
}
