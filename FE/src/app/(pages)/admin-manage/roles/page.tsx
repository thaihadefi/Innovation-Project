import { Metadata } from "next";
import { cookies } from "next/headers";
import { RolesClient } from "./RolesClient";

export const metadata: Metadata = { title: "Admin - Roles" };

export default async function AdminRolesPage() {
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
    <div className="p-[32px]">
      <h1 className="font-[700] text-[24px] text-[#121212] mb-[24px]">Roles</h1>
      <RolesClient initialRoles={roles} allPermissions={allPermissions} />
    </div>
  );
}
