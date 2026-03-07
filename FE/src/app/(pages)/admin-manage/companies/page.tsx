import { Metadata } from "next";
import { cookies } from "next/headers";
import { CompaniesClient } from "./CompaniesClient";
import { getAdminPermissions, hasPermission } from "../helpers";
import { NoPermission } from "../NoPermission";

export const metadata: Metadata = { title: "Admin - Companies" };

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> };

export default async function AdminCompaniesPage({ searchParams }: PageProps) {
  const permissions = await getAdminPermissions();
  if (!hasPermission(permissions, "companies_view")) {
    return <NoPermission />;
  }

  const params = await searchParams;
  const page = params.page || "1";
  const keyword = params.keyword || "";
  const status = params.status || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let companies: any[] = [];
  let pagination: any = null;

  try {
    const qs = new URLSearchParams({ page });
    if (keyword) qs.set("keyword", keyword);
    if (status) qs.set("status", status);

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/companies?${qs.toString()}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.code === "success") {
      companies = data.companies || [];
      pagination = data.pagination || null;
    }
  } catch {
    // silently fail
  }

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Companies</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Approve, ban, and manage company accounts</p>
      </div>
      <CompaniesClient initialCompanies={companies} initialPagination={pagination} />
    </div>
  );
}
