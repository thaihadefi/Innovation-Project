import { cookies } from "next/headers";

/**
 * Fetch current admin's permissions from the auth check endpoint.
 * Returns null if superadmin (full access).
 * Returns the permissions array from role if role is assigned.
 * Returns [] if no role and not superadmin (dashboard only).
 */
export async function getAdminPermissions(): Promise<string[] | null> {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/check`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.code !== "success") return [];

    // isSuperAdmin → full access (null)
    if (data.info?.isSuperAdmin) return null;

    // Has role → use role permissions
    if (data.info?.role) return data.info?.permissions || [];

    // No role + not superadmin → dashboard only (empty array)
    return [];
  } catch {
    return [];
  }
}

/**
 * Check if admin has a specific permission.
 * null permissions = superadmin = always true.
 */
export function hasPermission(permissions: string[] | null, permission: string): boolean {
  if (permissions === null) return true; // superadmin
  return permissions.includes(permission);
}
