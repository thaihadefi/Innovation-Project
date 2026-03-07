import { Metadata } from "next";
import { cookies } from "next/headers";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Admin - Profile" };

export default async function AdminProfilePage() {
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let info: any = null;

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/profile`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    if (data.code === "success") info = data.info;
  } catch {
    // silently fail
  }

  return (
    <div className="py-[24px] px-[16px] sm:py-[40px] sm:px-[32px]">
      <div className="mb-[28px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Personal Information</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Update your name and contact details</p>
      </div>
      <ProfileForm initialInfo={info} />
    </div>
  );
}
