import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeader } from "./AdminHeader";
import { AdminSocketProvider } from "@/contexts/AdminSocketContext";

import { getServerApiUrl } from "@/utils/get-server-api-url";

export default async function AdminManageLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  const apiUrl = getServerApiUrl();

  let adminEmail = "";
  let adminName = "";
  let adminAvatar: string | null = null;
  let permissions: string[] | null = null;
  let initialUnreadCount = 0;

  const getApiUrl = (endpoint: string) => {
    const base = process.env.API_URL || "http://nginx-proxy/api";
    return `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  };

  try {
    const [authRes, notifRes] = await Promise.all([
      fetch(getApiUrl("/admin/auth/check"), {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store",
      }),
      fetch(getApiUrl("/admin/notifications"), {
        headers: { Cookie: cookieString },
        credentials: "include",
        cache: "no-store",
      }).catch(() => null),
    ]);

    const data = await authRes.json();
    if (data.code !== "success") {
      redirect("/admin/login");
    }
    adminEmail = data.info?.email || "";
    adminName = data.info?.fullName || "";
    adminAvatar = data.info?.avatar || null;
    if (data.info?.isSuperAdmin) {
      permissions = null;
    } else if (data.info?.role) {
      permissions = data.info?.permissions || [];
    } else {
      permissions = [];
    }

    const notifData = notifRes ? await notifRes.json() : null;
    if (notifData?.code === "success") {
      initialUnreadCount = notifData.unreadCount || 0;
    }
  } catch {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar permissions={permissions} />
      <AdminSocketProvider>
        <div className="flex-1 flex flex-col overflow-auto min-w-0">
          <AdminHeader adminName={adminName} adminEmail={adminEmail} adminAvatar={adminAvatar} initialUnreadCount={initialUnreadCount} />
          <main className="flex-1 bg-[#F5F7FA]">
            {children}
          </main>
        </div>
      </AdminSocketProvider>
    </div>
  );
}
