import { cookies } from "next/headers";
import { NotificationsClient } from "./NotificationsClient";

type CompanyNotificationsPageProps = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function CompanyNotificationsPage({ searchParams }: CompanyNotificationsPageProps) {
  const params = await searchParams;
  const page = params.page as string || "1";

  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let notifications: any[] = [];
  let initialPagination: any = null;
  let initialUnreadCount = 0;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/notifications?page=${page}`, {
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
