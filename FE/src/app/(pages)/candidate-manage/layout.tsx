import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { getServerApiUrl } from "@/utils/get-server-api-url";

export default async function CandidateManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  const apiUrl = getServerApiUrl();

  try {
    const res = await fetch(`${apiUrl}/auth/check`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();

    if (data.code !== "success" || !data.infoCandidate) {
      const headersList = await headers();
      const currentPath = headersList.get("x-current-path") || "";
      redirect(`/candidate/login${currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : ""}`);
    }
  } catch {
    const headersList = await headers();
    const currentPath = headersList.get("x-current-path") || "";
    redirect(`/candidate/login${currentPath ? `?redirect=${encodeURIComponent(currentPath)}` : ""}`);
  }

  return <>{children}</>;
}
