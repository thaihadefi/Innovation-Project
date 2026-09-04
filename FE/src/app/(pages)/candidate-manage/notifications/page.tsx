import { cookies } from "next/headers";
import { NotificationsClient } from "./NotificationsClient";

import { getServerApiUrl } from "@/utils/get-server-api-url";

type NotificationsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function NotificationsPage({ searchParams }: NotificationsPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();

  let initialNotifications: any[] = [];
  let initialPagination: any = null;
  let initialUnreadCount = 0;
  try {
    const params = new URLSearchParams();
    params.set("page", page);
    const res = await fetch(`${apiUrl}/candidate/notifications?${params.toString()}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialNotifications = data.notifications || [];
      initialPagination = data.pagination || null;
      initialUnreadCount = data.unreadCount || 0;
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
  }

  return (
    <NotificationsClient
      initialNotifications={initialNotifications}
      initialPagination={initialPagination}
      initialUnreadCount={initialUnreadCount}
    />
  );
}
