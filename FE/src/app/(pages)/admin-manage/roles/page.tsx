import { Metadata } from "next";
import { cookies } from "next/headers";
import { RolesClient, type Role } from "./RolesClient";
import { getAdminPermissions, hasPermission, getServerApiUrl } from "../helpers";
import { NoPermission } from "../NoPermission";
import type { PaginationMeta } from "@/types/pagination";

export const metadata: Metadata = { title: "Admin - Role Management" };

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> };

export default async function AdminRolesPage({ searchParams }: PageProps) {
  const permissions = await getAdminPermissions();
  if (!hasPermission(permissions, "roles_view")) {
    return <NoPermission />;
  }

  const params = await searchParams;
  const page = params.page || "1";
  const keyword = params.keyword || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let roles: Role[] = [];
  let allPermissions: string[] = [];
  let pagination: PaginationMeta | null = null;

  try {
    const qs = new URLSearchParams({ page });
    if (keyword) qs.set("keyword", keyword);

    const [rolesRes, permsRes] = await Promise.all([
      fetch(getServerApiUrl(`/admin/roles?${qs.toString()}`), {
        headers: { Cookie: cookieString }, credentials: "include", cache: "no-store",
      }),
      fetch(getServerApiUrl("/admin/roles/permissions"), {
        headers: { Cookie: cookieString }, credentials: "include", cache: "no-store",
      }),
    ]);
    const [rolesData, permsData] = (await Promise.all([rolesRes.json(), permsRes.json()])) as [
      { code?: string; roles?: Role[]; pagination?: PaginationMeta },
      { code?: string; permissions?: string[] },
    ];
    if (rolesData.code === "success") {
      roles = rolesData.roles || [];
      pagination = rolesData.pagination || null;
    }
    if (permsData.code === "success") allPermissions = permsData.permissions || [];
  } catch { /* keep fallback values on error */ }

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Roles & Permissions</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Define roles and control access permissions</p>
      </div>
      <RolesClient initialRoles={roles} allPermissions={allPermissions} initialPagination={pagination} />
    </div>
  );
}
