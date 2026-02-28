import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

export default async function CandidateManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
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
