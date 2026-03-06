import { Metadata } from "next";
import { cookies } from "next/headers";
import { CandidatesClient } from "./CandidatesClient";

export const metadata: Metadata = { title: "Admin - Candidates" };

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> };

export default async function AdminCandidatesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page || "1";
  const keyword = params.keyword || "";
  const status = params.status || "";
  const verified = params.verified || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let candidates: any[] = [];
  let pagination: any = null;

  try {
    const qs = new URLSearchParams({ page });
    if (keyword) qs.set("keyword", keyword);
    if (status) qs.set("status", status);
    if (verified) qs.set("verified", verified);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/candidates?${qs.toString()}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.code === "success") {
      candidates = data.candidates || [];
      pagination = data.pagination || null;
    }
  } catch {
    // silently fail; client shows empty state
  }

  return (
    <div className="p-[32px]">
      <h1 className="font-[700] text-[24px] text-[#121212] mb-[24px]">Candidates</h1>
      <CandidatesClient initialCandidates={candidates} initialPagination={pagination} />
    </div>
  );
}
