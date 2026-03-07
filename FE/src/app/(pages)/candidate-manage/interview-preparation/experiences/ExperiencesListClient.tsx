"use client";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { FaPen, FaBuilding, FaSearch, FaThumbsUp, FaComment } from "react-icons/fa";

type Post = {
  _id: string;
  title: string;
  companyName: string;
  position: string;
  result: "passed" | "failed" | "pending";
  difficulty: "easy" | "medium" | "hard";
  authorName: string;
  isAnonymous: boolean;
  helpfulCount?: number;
  commentCount?: number;
  createdAt: string;
};

type Pagination = { totalRecord: number; totalPage: number; currentPage: number; pageSize: number };

const BASE = "/candidate-manage/interview-preparation/experiences";

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

export const ExperiencesListClient = ({
  initialPosts,
  initialPagination,
  keyword,
  result,
  difficulty,
}: {
  initialPosts: Post[];
  initialPagination: Pagination | null;
  keyword: string;
  result: string;
  difficulty: string;
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateQuery = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([k, v]) => { if (v) params.set(k, v); else params.delete(k); });
    params.delete("page");
    router.push(`${BASE}?${params.toString()}`);
  };

  const setPage = (p: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(p));
    router.push(`${BASE}?${params.toString()}`);
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  return (
    <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-[16px] sm:p-[24px] shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between gap-[12px] flex-wrap mb-[20px]">
        <div>
          <h1 className="text-[22px] font-[700] text-[#111827]">Interview Experiences</h1>
          <p className="text-[14px] text-[#6B7280] mt-[4px]">Real stories shared by UIT students and alumni</p>
        </div>
        <Link href={`${BASE}/create`}
          className="inline-flex items-center gap-[8px] h-[38px] px-[16px] rounded-[10px] bg-[#0088FF] text-white text-[13px] font-[500] hover:bg-[#006FCC] transition-all">
          <FaPen className="text-[11px]" /> Share Your Experience
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-[10px] mb-[20px]">
        <div className="relative">
          <FaSearch className="absolute left-[12px] top-1/2 -translate-y-1/2 text-[#9CA3AF] text-[11px]" />
          <input
            type="text"
            placeholder="Search by title, company, position..."
            defaultValue={keyword}
            onKeyDown={(e) => { if (e.key === "Enter") updateQuery({ keyword: (e.target as HTMLInputElement).value }); }}
            className="h-[36px] rounded-[8px] border border-[#E5E7EB] pl-[32px] pr-[12px] text-[13px] w-[260px] focus:border-[#0088FF] outline-none"
          />
        </div>
        <select value={result} onChange={(e) => updateQuery({ result: e.target.value })}
          className="h-[36px] rounded-[8px] border border-[#E5E7EB] px-[10px] text-[13px] focus:border-[#0088FF] outline-none">
          <option value="">All Results</option>
          <option value="passed">Passed</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
        </select>
        <select value={difficulty} onChange={(e) => updateQuery({ difficulty: e.target.value })}
          className="h-[36px] rounded-[8px] border border-[#E5E7EB] px-[10px] text-[13px] focus:border-[#0088FF] outline-none">
          <option value="">All Difficulty</option>
          <option value="easy">Easy</option>
          <option value="medium">Medium</option>
          <option value="hard">Hard</option>
        </select>
      </div>

      {/* Posts */}
      {initialPosts.length === 0 ? (
        <div className="text-center py-[48px]">
          <FaBuilding className="text-[28px] text-[#D1D5DB] mx-auto mb-[10px]" />
          <p className="text-[14px] font-[500] text-[#6B7280]">No experiences found</p>
          <p className="text-[13px] text-[#9CA3AF] mt-[4px]">Be the first to share yours!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {initialPosts.map((post) => (
            <Link key={post._id} href={`${BASE}/${post._id}`}
              className="block rounded-[12px] border border-[#E5E7EB] p-[16px] hover:shadow-md hover:border-[#0088FF]/30 transition-all bg-[#FAFAFA] hover:bg-white">
              <div className="flex items-start justify-between gap-[12px]">
                <div className="flex-1 min-w-0">
                  <h2 className="font-[600] text-[15px] text-[#111827] truncate">{post.title}</h2>
                  <p className="text-[13px] text-[#6B7280] mt-[3px]">
                    <span className="font-[500] text-[#374151]">{post.companyName}</span>
                    {" · "}{post.position}
                  </p>
                  <p className="text-[12px] text-[#9CA3AF] mt-[6px]">
                    {post.isAnonymous ? "Anonymous" : post.authorName} · {fmtDate(post.createdAt)}
                    {(post.helpfulCount || 0) > 0 && (
                      <span className="inline-flex items-center gap-[3px] ml-[10px] text-[#6B7280]">
                        <FaThumbsUp className="text-[10px]" /> {post.helpfulCount}
                      </span>
                    )}
                    {(post.commentCount || 0) > 0 && (
                      <span className="inline-flex items-center gap-[3px] ml-[10px] text-[#6B7280]">
                        <FaComment className="text-[10px]" /> {post.commentCount}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-[4px] shrink-0">
                  <span className={`px-[8px] py-[2px] rounded-full text-[11px] font-[600] uppercase ${resultColors[post.result]}`}>
                    {post.result}
                  </span>
                  <span className={`px-[8px] py-[2px] rounded-full text-[11px] font-[600] uppercase ${difficultyColors[post.difficulty]}`}>
                    {post.difficulty}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Pagination */}
      {initialPagination && initialPagination.totalPage > 1 && (
        <div className="flex items-center gap-[8px] mt-[20px] justify-center">
          {Array.from({ length: initialPagination.totalPage }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-[34px] h-[34px] rounded-[8px] text-[13px] font-[500] cursor-pointer transition-all ${
                initialPagination.currentPage === p ? "bg-[#0088FF] text-white" : "border border-[#E5E7EB] text-[#666] hover:border-[#0088FF]"
              }`}>{p}</button>
          ))}
        </div>
      )}
    </section>
  );
};
