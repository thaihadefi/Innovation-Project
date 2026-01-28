import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { CVDetailClient } from "./CVDetailClient";

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let cvDetail: any = null;
  let jobDetail: any = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/cv/detail/${id}`, {
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