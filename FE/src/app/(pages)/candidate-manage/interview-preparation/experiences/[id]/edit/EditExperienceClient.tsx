"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import Link from "next/link";
import dynamic from "next/dynamic";
import { FaArrowLeft } from "react-icons/fa";

const EditorMCE = dynamic(
  () => import("@/app/components/editor/EditorMCE").then(mod => mod.EditorMCE),
  { ssr: false, loading: () => <div className="h-[200px] bg-[#F9F9F9] rounded-[8px]" /> }
);

const schema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters!").max(150, "Title too long!"),
  companyName: z.string().min(1, "Please enter the company name!"),
  position: z.string().min(1, "Please enter the position!"),
  result: z.enum(["passed", "failed", "pending"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
});
type FormData = z.infer<typeof schema>;

const inputClass = (hasError: boolean) =>
  `w-full h-[42px] rounded-[8px] border px-[14px] text-[14px] outline-none transition-colors ${
    hasError ? "border-red-400 focus:border-red-500" : "border-[#DEDEDE] focus:border-[#0088FF]"
  }`;

type Post = {
  _id: string;
  title: string;
  content: string;
  companyName: string;
  position: string;
  result: "passed" | "failed" | "pending";
  difficulty: "easy" | "medium" | "hard";
  isAnonymous: boolean;
};

export const EditExperienceClient = ({ post }: { post: Post }) => {
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const BASE = `/candidate-manage/interview-preparation/experiences`;

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: post.title,
      companyName: post.companyName,
      position: post.position,
      result: post.result,
      difficulty: post.difficulty,
    },
  });

  const onSubmit = async (data: FormData) => {
    const content = editorRef.current?.getContent() || "";
    if (content.replace(/<[^>]+>/g, "").trim().length < 20) {
      toast.error("Please write more content (at least 20 characters)!");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${post._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, content }),
        credentials: "include",
      });
      const result = await res.json();
      if (result.code === "error") { toast.error(result.message); return; }
      toast.success(result.message || "Post updated and pending review!");
      router.push(BASE);
    } catch { toast.error("Network error. Please try again."); }
    finally { setSubmitting(false); }
  };


  return (
    <div className="max-w-[800px] mx-auto px-[16px] py-[40px]">
      <Link href={`${BASE}/${post._id}`}
        className="inline-flex items-center gap-[6px] text-[13px] text-[#6B7280] hover:text-[#0088FF] mb-[24px] transition-colors">
        <FaArrowLeft className="text-[11px]" /> Back to Post
      </Link>

      <div className="bg-white rounded-[16px] border border-[#E8E8E8] p-[32px]">
        <h1 className="text-[22px] font-[700] text-[#111827] mb-[6px]">Edit Experience</h1>
        <p className="text-[14px] text-[#6B7280] mb-[28px]">Saving changes will reset the post to pending review.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-[18px]">
          <div>
            <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Title *</label>
            <input {...register("title")} className={inputClass(!!errors.title)} />
            {errors.title && <p className="text-[12px] text-red-500 mt-[4px]">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Company *</label>
              <input {...register("companyName")} className={inputClass(!!errors.companyName)} />
              {errors.companyName && <p className="text-[12px] text-red-500 mt-[4px]">{errors.companyName.message}</p>}
            </div>
            <div>
              <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Position *</label>
              <input {...register("position")} className={inputClass(!!errors.position)} />
              {errors.position && <p className="text-[12px] text-red-500 mt-[4px]">{errors.position.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-[14px]">
            <div>
              <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Interview Result *</label>
              <select {...register("result")} className={inputClass(!!errors.result)}>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="pending">Still Pending</option>
              </select>
            </div>
            <div>
              <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Difficulty *</label>
              <select {...register("difficulty")} className={inputClass(!!errors.difficulty)}>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[13px] font-[500] text-[#444] mb-[6px] block">Your Experience *</label>
            <EditorMCE editorRef={editorRef} value={post.content} />
          </div>

          <div className="flex gap-[12px] mt-[8px]">
            <Link href={`${BASE}/${post._id}`}
              className="flex-1 h-[42px] rounded-[8px] border border-[#DEDEDE] text-[14px] text-[#666] hover:bg-[#F5F7FA] transition-all cursor-pointer flex items-center justify-center">
              Cancel
            </Link>
            <button type="submit" disabled={submitting}
              className="flex-1 h-[42px] rounded-[8px] bg-[#0088FF] text-white text-[14px] font-[500] hover:bg-[#006FCC] transition-all cursor-pointer disabled:opacity-50">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
