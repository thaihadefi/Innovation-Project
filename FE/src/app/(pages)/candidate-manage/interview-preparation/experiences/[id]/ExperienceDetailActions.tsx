"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FaEdit, FaTrash } from "react-icons/fa";
import { ConfirmModal } from "@/app/components/modal/ConfirmModal";

export const ExperienceDetailActions = ({ postId }: { postId: string }) => {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${postId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.code === "error") { toast.error(data.message); return; }
      toast.success("Post deleted.");
      router.push("/candidate-manage/interview-preparation/experiences");
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-[10px] mt-[20px] pt-[20px] border-t border-[#F0F0F0]">
        <Link
          href={`/candidate-manage/interview-preparation/experiences/${postId}/edit`}
          className="inline-flex items-center gap-[6px] h-[34px] px-[14px] rounded-[8px] border border-[#0088FF] text-[#0088FF] text-[13px] font-[500] hover:bg-[#0088FF] hover:text-white transition-all"
        >
          <FaEdit className="text-[11px]" /> Edit
        </Link>
        <button
          onClick={() => setConfirmOpen(true)}
          disabled={deleting}
          className="inline-flex items-center gap-[6px] h-[34px] px-[14px] rounded-[8px] border border-red-400 text-red-500 text-[13px] font-[500] hover:bg-red-500 hover:text-white transition-all cursor-pointer disabled:opacity-50"
        >
          <FaTrash className="text-[11px]" /> Delete
        </button>
        <span className="text-[12px] text-[#9CA3AF]">Your post — editing will require re-approval.</span>
      </div>
      <ConfirmModal
        isOpen={confirmOpen}
        title="Delete Post"
        message="Are you sure you want to delete this post? This cannot be undone."
        confirmLabel="Delete"
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
};
