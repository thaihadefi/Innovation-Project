import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CVDetailClient } from "./CVDetailClient";

import { getServerApiUrl } from "@/utils/get-server-api-url";
import type { CvDetail } from "@/types/cv";
import type { JobCard } from "@/types/job";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let cvDetail: CvDetail | null = null;
  let jobDetail: JobCard | null = null;

  try {
    const res = await fetch(`${apiUrl}/company/cv/detail/${id}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();

    if (data.code === "success") {
      cvDetail = data.cvDetail;
      jobDetail = data.jobDetail;
    } else {
      redirect("/company-manage/cv/list");
    }
  } catch (error) {
    console.error("Failed to fetch CV detail:", error);
    redirect("/company-manage/cv/list");
  }

  return <CVDetailClient cvId={id} initialCVDetail={cvDetail} initialJobDetail={jobDetail} />;
}