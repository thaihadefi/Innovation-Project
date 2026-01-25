/* eslint-disable @typescript-eslint/no-explicit-any */
import { cookies } from "next/headers";
import { NotificationsClient } from "./NotificationsClient";

export default async function CompanyNotificationsPage() {
  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let notifications: any[] = [];

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/notifications`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();

    if (data.code === "success") {
      notifications = data.notifications || [];
    }
  } catch (error) {
    console.error("Failed to fetch notifications:", error);
  }

  return <NotificationsClient initialNotifications={notifications} />;
}
