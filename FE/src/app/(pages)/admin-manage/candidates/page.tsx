import { Metadata } from "next";
import { cookies } from "next/headers";
import { CandidatesClient, type Candidate } from "./CandidatesClient";
import { getAdminPermissions, hasPermission, getServerApiUrl } from "../helpers";
import { NoPermission } from "../NoPermission";
import type { PaginationMeta } from "@/types/pagination";

export const metadata: Metadata = { title: "Admin - Candidates" };

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> };

export default async function AdminCandidatesPage({ searchParams }: PageProps) {
  const permissions = await getAdminPermissions();
  if (!hasPermission(permissions, "candidates_view")) {
    return <NoPermission />;
  }

  const params = await searchParams;
  const page = params.page || "1";
  const keyword = params.keyword || "";
  const status = params.status || "";
  const verified = params.verified || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let candidates: Candidate[] = [];
  let pagination: PaginationMeta | null = null;

  try {
    const qs = new URLSearchParams({ page });
    if (keyword) qs.set("keyword", keyword);
    if (status) qs.set("status", status);
    if (verified) qs.set("verified", verified);

    const res = await fetch(getServerApiUrl(`/admin/candidates?${qs.toString()}`), {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = (await res.json()) as { code?: string; candidates?: Candidate[]; pagination?: PaginationMeta };
    if (data.code === "success") {
      candidates = data.candidates || [];
      pagination = data.pagination || null;
    }
  } catch { /* keep fallback values on error */ }

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Candidates</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Manage candidate accounts and verifications</p>
      </div>
      <CandidatesClient initialCandidates={candidates} initialPagination={pagination} />
    </div>
  );
}
