import { Metadata } from "next";
import { cookies } from "next/headers";
import { ReviewsAdminClient } from "./ReviewsAdminClient";

export const metadata: Metadata = { title: "Reviews – Admin" };

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function AdminReviewsPage({ searchParams }: Props) {
  const params = await searchParams;
  const keyword = String(params.keyword || "");
  const status = String(params.status || "");
  const page = String(params.page || "1");

  const API_URL = process.env.API_URL || "http://localhost:4001";
  const cookieStore = await cookies();
  const cookieString = cookieStore.toString();

  const qs = new URLSearchParams();
  if (keyword) qs.set("keyword", keyword);
  if (status) qs.set("status", status);
  qs.set("page", page);

  const data = await fetch(`${API_URL}/admin/reviews?${qs.toString()}`, {
    headers: { Cookie: cookieString },
    cache: "no-store",
  })
    .then((r) => r.json())
    .catch(() => ({ code: "error" }));

  const reviews = data.code === "success" ? (data.reviews || []) : [];
  const pagination = data.code === "success" ? data.pagination : null;

  return (
    <ReviewsAdminClient
      initialReviews={reviews}
      initialPagination={pagination}
      statusFilter={status}
      keyword={keyword}
    />
  );
}
