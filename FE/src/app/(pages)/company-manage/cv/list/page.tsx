import { cookies } from "next/headers";
import { CVList } from "./CVList";

export default async function Page() {
  // Fetch data on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  let initialCVList: any[] = [];
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/cv/list`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialCVList = data.cvList || [];
    }
  } catch (error) {
    console.error("Failed to fetch CV list:", error);
  }

  return (
    <>
      {/* Manage Applications */}
      <div className="py-[60px]">
        <div className="container">
          <div className="flex flex-wrap items-center justify-between gap-[20px] mb-[20px]">
            <h1 className="font-[700] sm:text-[28px] text-[24px] text-[#121212]">
              Manage Applications
            </h1>
          </div>
          <CVList initialCVList={initialCVList} />
        </div>
      </div>
      {/* End Manage Applications */}
    </>
  )
}