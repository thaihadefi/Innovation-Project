import { cookies } from "next/headers";
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
      redirect("/candidate/login");
    }
  } catch {
    redirect("/candidate/login");
  }

  return <>{children}</>;
}
