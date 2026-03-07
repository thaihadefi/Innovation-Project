import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import DOMPurify from "isomorphic-dompurify";
import { FaBuilding, FaUser, FaCalendar } from "react-icons/fa";
import { ExperienceDetailActions } from "./ExperienceDetailActions";

type Props = { params: Promise<{ id: string }> };

const resultColors: Record<string, string> = {
  passed: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-600",
  pending: "bg-yellow-100 text-yellow-700",
};
const difficultyColors: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-orange-100 text-orange-700",
  hard: "bg-red-100 text-red-600",
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const API_URL = process.env.API_URL || "http://localhost:4001";
  const data = await fetch(`${API_URL}/interview-experiences/${id}`, { cache: "no-store" })
    .then((r) => r.json())
    .catch(() => ({ code: "error" }));
  return { title: data.post?.title || "Interview Experience" };
}

export default async function ExperienceDetailPage({ params }: Props) {
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
  const isAuthor = !!currentCandidateId && currentCandidateId === post.authorId?.toString();

  const safeHtml = DOMPurify.sanitize(post.content);
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-[16px] sm:p-[32px] shadow-sm">
      {/* Badges */}
      <div className="flex flex-wrap gap-[8px] mb-[14px]">
        <span className={`px-[10px] py-[3px] rounded-full text-[12px] font-[600] uppercase ${resultColors[post.result]}`}>
          {post.result}
        </span>
        <span className={`px-[10px] py-[3px] rounded-full text-[12px] font-[600] uppercase ${difficultyColors[post.difficulty]}`}>
          {post.difficulty}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-[22px] font-[700] text-[#111827] mb-[12px]">{post.title}</h1>

      {/* Meta */}
      <div className="flex flex-wrap gap-[14px] text-[13px] text-[#6B7280] mb-[24px] pb-[20px] border-b border-[#F0F0F0]">
        <span className="flex items-center gap-[6px]">
          <FaBuilding className="text-[11px]" /> {post.companyName} · {post.position}
        </span>
        <span className="flex items-center gap-[6px]">
          <FaUser className="text-[11px]" /> {post.isAnonymous ? "Anonymous" : post.authorName}
        </span>
        <span className="flex items-center gap-[6px]">
          <FaCalendar className="text-[11px]" /> {fmtDate(post.createdAt)}
        </span>
      </div>

      {/* Content */}
      <div
        className="prose prose-sm max-w-none text-[15px] leading-relaxed text-[#374151]"
        dangerouslySetInnerHTML={{ __html: safeHtml }}
      />

      {/* Author actions */}
      {isAuthor && <ExperienceDetailActions postId={post._id.toString()} />}
    </section>
  );
}
