import { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { EditExperienceClient } from "./EditExperienceClient";

type Props = { params: Promise<{ id: string }> };

export const metadata: Metadata = { title: "Edit Experience" };

export default async function EditExperiencePage({ params }: Props) {
  const { id } = await params;
  const API_URL = process.env.API_URL || "http://localhost:4001";

  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  const [postData, authData] = await Promise.all([
    fetch(`${API_URL}/interview-experiences/${id}`, { cache: "no-store" })
      .then((r) => r.json())
      .catch(() => ({ code: "error" })),
    fetch(`${API_URL}/auth/check`, {
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
