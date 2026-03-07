import { Metadata } from "next";
import { ExperiencesListClient } from "./ExperiencesListClient";

export const metadata: Metadata = { title: "Interview Experiences" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function InterviewExperiencesPage({ searchParams }: Props) {
  const params = await searchParams;
  const keyword = String(params.keyword || "");
  const result = String(params.result || "");
  const difficulty = String(params.difficulty || "");
  const page = String(params.page || "1");

  const API_URL = process.env.API_URL || "http://localhost:4001";
  const qs = new URLSearchParams();
  if (keyword) qs.set("keyword", keyword);
  if (result) qs.set("result", result);
  if (difficulty) qs.set("difficulty", difficulty);
  qs.set("page", page);

  const data = await fetch(`${API_URL}/interview-experiences?${qs.toString()}`, {
    cache: "no-store",
  })
    .then((r) => r.json())
    .catch(() => ({ code: "error" }));

  const posts = data.code === "success" ? (data.posts || []) : [];
  const pagination = data.code === "success" ? data.pagination : null;

  return (
    <ExperiencesListClient
      initialPosts={posts}
      initialPagination={pagination}
      keyword={keyword}
      result={result}
      difficulty={difficulty}
    />
  );
}
