import { cookies } from "next/headers";

export function getServerApiUrl(endpoint: string): string {
  const base = process.env.API_URL || "http://nginx-proxy/api";
  return `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
}

export async function getAdminPermissions(): Promise<string[] | null> {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  try {
    const res = await fetch(getServerApiUrl("/admin/auth/check"), {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.code !== "success") return [];

    if (data.info?.isSuperAdmin) return null;

    if (data.info?.role) return data.info?.permissions || [];

    return [];
  } catch {
    return [];
  }
}

export function hasPermission(permissions: string[] | null, permission: string): boolean {
  if (permissions === null) return true;
  return permissions.includes(permission);
}
