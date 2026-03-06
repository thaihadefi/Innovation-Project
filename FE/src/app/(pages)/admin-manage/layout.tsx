import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "./AdminSidebar";

export default async function AdminManageLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

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
  } catch {
    redirect("/admin/login");
  }

  return (
    <div className="flex min-h-screen bg-[#F5F7FA]">
      <AdminSidebar />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
