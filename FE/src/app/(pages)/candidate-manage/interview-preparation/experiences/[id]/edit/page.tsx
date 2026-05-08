import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { EditExperienceClient } from "./EditExperienceClient";
import { getServerApiUrl } from "@/utils/get-server-api-url";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit Experience" };

export default async function EditExperiencePage({ params }: Props) {
  const { id } = await params;
  const apiUrl = getServerApiUrl();

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  const [postData, authData] = await Promise.all([
    fetch(`${apiUrl}/interview-experiences/${id}`, {
      headers: { Cookie: cookieString },
      cache: "no-store",
    })
      .then((r) => r.json())
      .catch(() => ({ code: "error" })),
    fetch(`${apiUrl}/auth/check`, {
      headers: { Cookie: cookieString },
      cache: "no-store",
    })
      .then((r) => r.json())
      .catch(() => ({ code: "error" })),
  ]);

  if (postData.code !== "success" || !postData.post) notFound();

  const post = postData.post;
  const currentCandidateId = authData.infoCandidate?.id?.toString();
  if (!currentCandidateId || currentCandidateId !== post.authorId?.toString()) {
    redirect(`/candidate-manage/interview-preparation/experiences/${id}`);
  }

  return <EditExperienceClient post={post} />;
}
