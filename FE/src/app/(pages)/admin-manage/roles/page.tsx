import { Metadata } from "next";
import { cookies } from "next/headers";
import { RolesClient } from "./RolesClient";
import { getAdminPermissions, hasPermission } from "../helpers";
import { NoPermission } from "../NoPermission";

export const metadata: Metadata = { title: "Admin - Roles" };

export default async function AdminRolesPage() {
  const permissions = await getAdminPermissions();
  if (!hasPermission(permissions, "roles_view")) {
    return <NoPermission />;
  }

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let roles: any[] = [];
  let allPermissions: string[] = [];

  try {
    const [rolesRes, permsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        headers: { Cookie: cookieString }, credentials: "include", cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles/permissions`, {
        headers: { Cookie: cookieString }, credentials: "include", cache: "no-store",
      }),
    ]);
    const [rolesData, permsData] = await Promise.all([rolesRes.json(), permsRes.json()]);
    if (rolesData.code === "success") roles = rolesData.roles || [];
    if (permsData.code === "success") allPermissions = permsData.permissions || [];
  } catch {
    // silently fail
  }

  return (
    <div className="py-[40px] px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Roles & Permissions</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Define roles and control access permissions</p>
      </div>
      <RolesClient initialRoles={roles} allPermissions={allPermissions} />
    </div>
  );
}
