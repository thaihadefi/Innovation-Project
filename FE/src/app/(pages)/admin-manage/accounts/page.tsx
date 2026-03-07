import { Metadata } from "next";
import { cookies } from "next/headers";
import { AccountsClient } from "./AccountsClient";
import { getAdminPermissions, hasPermission } from "../helpers";
import { NoPermission } from "../NoPermission";

export const metadata: Metadata = { title: "Admin - Accounts" };

type PageProps = { searchParams: Promise<{ [key: string]: string | undefined }> };

export default async function AdminAccountsPage({ searchParams }: PageProps) {
  const permissions = await getAdminPermissions();
  if (!hasPermission(permissions, "accounts_view")) {
    return <NoPermission />;
  }

  const params = await searchParams;
  const page = params.page || "1";
  const keyword = params.keyword || "";
  const status = params.status || "";
  const roleId = params.roleId || "";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let accounts: any[] = [];
  let pagination: any = null;
  let roles: any[] = [];

  try {
    const qs = new URLSearchParams({ page });
    if (keyword) qs.set("keyword", keyword);
    if (status) qs.set("status", status);
    if (roleId) qs.set("roleId", roleId);

    const [accountsRes, rolesRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/accounts?${qs.toString()}`, {
        headers: { Cookie: cookieString }, credentials: "include", cache: "no-store",
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/roles`, {
        headers: { Cookie: cookieString }, credentials: "include", cache: "no-store",
      }),
    ]);

    const [accountsData, rolesData] = await Promise.all([accountsRes.json(), rolesRes.json()]);
    if (accountsData.code === "success") {
      accounts = accountsData.accounts || [];
      pagination = accountsData.pagination || null;
    }
    if (rolesData.code === "success") roles = rolesData.roles || [];
  } catch {
    // silently fail
  }

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[24px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Admin Accounts</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Manage admin users and their roles</p>
      </div>
      <AccountsClient initialAccounts={accounts} initialPagination={pagination} roles={roles} />
    </div>
  );
}
