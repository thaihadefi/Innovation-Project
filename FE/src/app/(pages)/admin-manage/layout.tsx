import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";

export default async function AdminManageLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let adminEmail = "";
  let adminName = "";
  let adminAvatar: string | null = null;
  let permissions: string[] | null = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/check`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.code !== "success") {
      redirect("/admin/login");
    }
    adminEmail = data.info?.email || "";
    adminName = data.info?.fullName || "";
    adminAvatar = data.info?.avatar || null;
    // isSuperAdmin → full access (null permissions)
    // Has role → use role permissions
    // No role + not superadmin → empty array (dashboard only)
    if (data.info?.isSuperAdmin) {
      permissions = null;
    } else if (data.info?.role) {
      permissions = data.info?.permissions || [];
    } else {
      permissions = [];
    }
  } catch {
    redirect("/admin/login");
  }

  // Preload notification count on server to prevent badge flash
  let initialUnreadCount = 0;
  try {
    const notifRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/notifications`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const notifData = await notifRes.json();
    if (notifData.code === "success") {
      initialUnreadCount = notifData.unreadCount || 0;
    }
  } catch {
    // Ignore notification fetch errors
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar permissions={permissions} />
      <div className="flex-1 flex flex-col overflow-auto min-w-0">
        <AdminHeader adminName={adminName} adminEmail={adminEmail} adminAvatar={adminAvatar} initialUnreadCount={initialUnreadCount} />
        <main className="flex-1 bg-[#F5F7FA]">
          {children}
        </main>
      </div>
    </div>
  );
}
