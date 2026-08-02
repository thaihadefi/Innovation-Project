import { Metadata } from "next";
import { cookies } from "next/headers";
import { NotificationsClient } from "./NotificationsClient";
import { getServerApiUrl } from "../helpers";

export const metadata: Metadata = { title: "Admin Notifications" };

type PageProps = { searchParams: Promise<{ page?: string }> };

export default async function AdminNotificationsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = params.page || "1";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let notifications: any[] = [];
  let initialPagination: any = null;
  let initialUnreadCount = 0;

  try {
    const queryParams = new URLSearchParams();
    queryParams.set("page", page);
    const res = await fetch(getServerApiUrl(`/admin/notifications?${queryParams.toString()}`), {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();

    if (data.code === "success") {
      notifications = data.notifications || [];
      initialPagination = data.pagination || null;
      initialUnreadCount = data.unreadCount || 0;
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
  }

  return (
    <NotificationsClient
      initialNotifications={notifications}
      initialPagination={initialPagination}
      initialUnreadCount={initialUnreadCount}
    />
  );
}
