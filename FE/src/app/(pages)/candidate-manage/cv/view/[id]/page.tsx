import { CVViewer } from "./CVViewer";
import { cookies } from "next/headers";

import { getServerApiUrl } from "@/utils/get-server-api-url";

export default async function CVViewPage(props: PageProps<'/candidate-manage/cv/view/[id]'>) {
  const { id } = await props.params;
  
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
        <CVViewer cvId={id} initialCVDetail={initialCVDetail} />
      </div>
    </div>
  );
}
