import { cookies } from "next/headers";
import { NotificationsClient } from "./NotificationsClient";

import { getServerApiUrl } from "@/utils/get-server-api-url";

type CompanyNotificationsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CompanyNotificationsPage({ searchParams }: CompanyNotificationsPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let notifications: any[] = [];
  let initialPagination: any = null;
  let initialUnreadCount = 0;

  try {
    const params = new URLSearchParams();
    params.set("page", page);
    const res = await fetch(`${apiUrl}/company/notifications?${params.toString()}`, {
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
