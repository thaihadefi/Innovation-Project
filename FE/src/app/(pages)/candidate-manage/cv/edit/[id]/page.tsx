import { CVEditForm } from "./CVEditForm";
import { cookies } from "next/headers";

import { getServerApiUrl } from "@/utils/get-server-api-url";

export default async function CVEditPage(props: PageProps<'/candidate-manage/cv/edit/[id]'>) {
  const { id } = await props.params;
  
  // Fetch CV detail on server
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();
  const apiUrl = getServerApiUrl();
  
  let initialCVDetail: any = null;
  try {
    const res = await fetch(`${apiUrl}/candidate/cv/detail/${id}`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store"
    });
    const data = await res.json();
    if (data.code === "success") {
      initialCVDetail = data.cvDetail;
    }
  } catch (error) {
    console.error("Failed to fetch CV detail:", error);
  }

  return (
    <div className="py-[30px]">
      <div className="container">
        <CVEditForm cvId={id} initialCVDetail={initialCVDetail} />
      </div>
    </div>
  );
}
