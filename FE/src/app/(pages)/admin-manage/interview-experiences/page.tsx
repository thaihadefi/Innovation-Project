import { Metadata } from "next";
import { cookies } from "next/headers";
import { InterviewExperiencesAdminClient } from "./InterviewExperiencesAdminClient";
import { getAdminPermissions, hasPermission } from "../helpers";
import { NoPermission } from "../NoPermission";

export const metadata: Metadata = { title: "Interview Experiences — Admin" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminInterviewExperiencesPage({ searchParams }: Props) {
  const permissions = await getAdminPermissions();
  if (!hasPermission(permissions, "experiences_view")) {
    return <NoPermission />;
  }

  const params = await searchParams;
  const status = String(params.status || "");
  const keyword = String(params.keyword || "");
  const page = String(params.page || "1");

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const API_URL = process.env.API_URL || "http://localhost:4001";

  const qs = new URLSearchParams();
  if (status) qs.set("status", status);
  if (keyword) qs.set("keyword", keyword);
  qs.set("page", page);

  const data = await fetch(`${API_URL}/admin/experiences?${qs.toString()}`, {
    headers: { Cookie: cookieString },
    cache: "no-store",
  })
    .then((r) => r.json())
    .catch(() => ({ code: "error" }));

  const posts = data.code === "success" ? (data.posts || []) : [];
  const pagination = data.code === "success" ? data.pagination : null;

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Interview Experiences</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Review and moderate community posts</p>
      </div>
      <InterviewExperiencesAdminClient
        initialPosts={posts}
        initialPagination={pagination}
        statusFilter={status}
        keyword={keyword}
      />
    </div>
  );
}
