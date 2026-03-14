"use client";
import { useState, useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";
import { FaThumbsUp, FaReply, FaTrash, FaFlag, FaUser, FaUserSecret, FaPen } from "react-icons/fa6";

const commentSchema = z.object({
  content: z.string().min(1, "Comment content cannot be empty").max(2000, "Comment must not exceed 2000 characters"),
  isAnonymous: z.boolean(),
});

const reportSchema = z.object({
  reason: z.string().min(5, "Reason must be at least 5 characters").max(500, "Reason must not exceed 500 characters"),
});

type CommentFormData = z.infer<typeof commentSchema>;
type ReportFormData = z.infer<typeof reportSchema>;

interface Comment {
  _id: string;
  authorId: string;
  authorName: string;
  isAnonymous?: boolean;
  content: string;
  helpfulCount: number;
  helpfulVotes: string[];
  parentId: string | null;
  replyToId?: string | null;
  replyToName?: string | null;
  isEdited?: boolean;
  createdAt: string;
  replies?: Comment[];
}

export const ExperienceComments = ({
  postId,
  isLoggedIn,
  currentUserId,
}: {
  postId: string;
  isLoggedIn: boolean;
  currentUserId: string;
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalComments, setTotalComments] = useState(0);

  // Main comment form
  const mainForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "", isAnonymous: false },
  });

  // Reply form
  const replyForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "", isAnonymous: false },
  });

  // Edit form
  const editForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "", isAnonymous: false },
  });

  // Report form
  const reportForm = useForm<ReportFormData>({
    resolver: zodResolver(reportSchema),
    defaultValues: { reason: "" },
  });

  // Build nested tree from flat replies using replyToId
  const buildReplyTree = useCallback((flatReplies: Comment[], rootId: string): Comment[] => {
    // Map: commentId -> its children
    const childrenMap = new Map<string, Comment[]>();
    // Direct replies to root (replyToId === rootId or no replyToId)
    const rootReplies: Comment[] = [];

    flatReplies.forEach((r) => {
      const parent = r.replyToId && r.replyToId !== rootId ? r.replyToId : rootId;
      if (parent === rootId) {
        rootReplies.push(r);
      } else {
        if (!childrenMap.has(parent)) childrenMap.set(parent, []);
        childrenMap.get(parent)!.push(r);
      }
    });

    // Recursively attach children
    const attachChildren = (comment: Comment): Comment => ({
      ...comment,
      replies: (childrenMap.get(comment._id) || []).map(attachChildren),
    });

    return rootReplies.map(attachChildren);
  }, []);

  const fetchComments = useCallback(async (p: number = 1) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${postId}/comments?page=${p}`,
        { credentials: "include" }
      );
      const data = await res.json();
      if (data.code === "success") {
        // Rebuild nested tree for each top-level comment
        const treifiedComments = data.comments.map((c: Comment) => ({
          ...c,
          replies: c.replies ? buildReplyTree(c.replies, c._id) : [],
        }));
        setComments(treifiedComments);
        setTotalPages(data.pagination.totalPage);
        setPage(data.pagination.currentPage);
        setTotalComments(data.pagination.totalRecord);
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false);
    }
  }, [postId, buildReplyTree]);

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  const onSubmitComment = async (data: CommentFormData) => {
    if (!isLoggedIn) {
      toast.info("Please login to comment.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content.trim(), isAnonymous: data.isAnonymous }),
        credentials: "include",
      });
      const resData = await res.json();
      if (resData.code === "success") {
        toast.success("Comment posted.");
        mainForm.reset();
        fetchComments(1);
      } else {
        toast.error(resData.message || "Failed to post comment.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitReply = async (data: CommentFormData) => {
    if (!isLoggedIn || !replyTo) {
      toast.info("Please login to reply.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content.trim(), parentId: replyTo.id, isAnonymous: data.isAnonymous }),
        credentials: "include",
      });
      const resData = await res.json();
      if (resData.code === "success") {
        toast.success("Reply posted.");
        setReplyTo(null);
        replyForm.reset();
        fetchComments(page);
      } else {
        toast.error(resData.message || "Failed to post reply.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/comments/${commentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (data.code === "success") {
        toast.success("Comment deleted.");
        fetchComments(page);
      } else {
        toast.error(data.message || "Failed to delete.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitEdit = async (data: CommentFormData) => {
    if (!editingId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/comments/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: data.content.trim() }),
        credentials: "include",
      });
      const resData = await res.json();
      if (resData.code === "success") {
        toast.success("Comment updated.");
        const updateCommentContent = (list: Comment[]): Comment[] =>
          list.map((c) => {
            if (c._id === editingId) {
              return { ...c, content: resData.comment.content, isEdited: true };
            }
            if (c.replies) {
              return { ...c, replies: updateCommentContent(c.replies) };
            }
            return c;
          });
        setComments(updateCommentContent);
        setEditingId(null);
        editForm.reset();
      } else {
        toast.error(resData.message || "Failed to update.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment._id);
    editForm.setValue("content", comment.content);
    // Close reply form if open
    setReplyTo(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    editForm.reset();
  };

  const handleHelpful = async (commentId: string) => {
    if (!isLoggedIn) {
      toast.info("Please login to mark as helpful.");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/comments/${commentId}/helpful`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (data.code === "success") {
        // Update in state
        const updateCommentHelpful = (list: Comment[]): Comment[] =>
          list.map((c) => {
            if (c._id === commentId) {
              return { ...c, helpfulCount: data.helpfulCount };
            }
            if (c.replies) {
              return { ...c, replies: updateCommentHelpful(c.replies) };
            }
            return c;
          });
        setComments(updateCommentHelpful);
        toast.success(data.isHelpful ? "Marked as helpful" : "Unmarked");
      } else {
        toast.error(data.message || "Failed to update.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmitReport = async (data: ReportFormData) => {
    if (!reportModal) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/comments/${reportModal}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: data.reason.trim() }),
        credentials: "include",
      });
      const resData = await res.json();
      if (resData.code === "success") {
        toast.success(resData.message);
        setReportModal(null);
        reportForm.reset();
      } else {
        toast.error(resData.message || "Failed to submit report.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

  const MAX_NEST_DEPTH = 4;

  const renderComment = (comment: Comment, depth = 0) => {
    const isReply = depth > 0;
    const indentPx = depth > 0 ? Math.min(depth, MAX_NEST_DEPTH) * 24 : 0;

    return (
    <div key={comment._id} style={isReply ? { marginLeft: `${indentPx}px` } : undefined}>
      {isReply && (
        <div className="border-l-2 border-[#E5E7EB] pl-[14px]">
          <div className="py-[10px]">
            {/* Header */}
            <div className="flex items-center gap-[8px] mb-[6px]">
              <div className="w-[24px] h-[24px] rounded-full bg-[#E5E5E5] flex items-center justify-center shrink-0">
                {comment.isAnonymous ? (
                  <FaUserSecret className="text-[9px] text-[#999]" />
                ) : (
                  <FaUser className="text-[9px] text-[#999]" />
                )}
              </div>
              <div className="flex items-center gap-[6px] flex-wrap">
                <span className={`font-[600] text-[12px] ${comment.isAnonymous ? "text-[#9CA3AF] italic" : "text-[#111827]"}`}>
                  {comment.isAnonymous ? "Anonymous" : comment.authorName}
                </span>
                {comment.replyToName && (
                  <span className="text-[11px] text-[#9CA3AF]">
                    → <span className="text-[#0088FF]">@{comment.replyToName}</span>
                  </span>
                )}
                <span className="text-[11px] text-[#C0C4CC]">·</span>
                <span className="text-[11px] text-[#9CA3AF]">{fmtDate(comment.createdAt)}</span>
                {comment.isEdited && (
                  <span className="text-[10px] text-[#C0C4CC] italic">(edited)</span>
                )}
              </div>
            </div>

            {/* Content or Edit form */}
            {editingId === comment._id ? (
              <div className="pl-[32px] mb-[6px]">
                <textarea
                  {...editForm.register("content")}
                  rows={2}
                  maxLength={2000}
                  className={`w-full border ${editForm.formState.errors.content ? "border-red-400" : "border-[#E5E7EB]"} rounded-[8px] px-[10px] py-[6px] text-[12px] focus:border-[#0088FF] outline-none resize-none`}
                />
                <div className="flex items-center gap-[6px] mt-[4px]">
                  <button
                    onClick={editForm.handleSubmit(onSubmitEdit)}
                    disabled={submitting}
                    className="h-[26px] px-[12px] rounded-[6px] bg-[#0088FF] text-white text-[11px] font-[500] hover:bg-[#006FCC] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="h-[26px] px-[12px] rounded-[6px] border border-[#E5E7EB] text-[#666] text-[11px] font-[500] hover:bg-[#F9F9F9] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <span className="text-[10px] text-[#9CA3AF] ml-auto">{editForm.watch("content")?.length || 0}/2000</span>
                </div>
              </div>
            ) : (
              <div
                className="text-[13px] text-[#374151] mb-[6px] pl-[32px]"
                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
              />
            )}

            {/* Actions */}
            <div className="flex items-center gap-[10px] pl-[32px]">
              <button
                onClick={() => handleHelpful(comment._id)}
                className="flex items-center gap-[3px] text-[11px] text-[#9CA3AF] hover:text-[#0088FF] cursor-pointer transition-colors"
              >
                <FaThumbsUp className="text-[9px]" />
                {comment.helpfulCount > 0 ? comment.helpfulCount : "Helpful"}
              </button>

              {isLoggedIn && (
                <button
                  onClick={() => {
                    if (replyTo?.id === comment._id) {
                      setReplyTo(null);
                      replyForm.reset();
                    } else {
                      setReplyTo({ id: comment._id, name: comment.authorName });
                      replyForm.reset({ content: "", isAnonymous: false });
                    }
                  }}
                  className="flex items-center gap-[3px] text-[11px] text-[#9CA3AF] hover:text-[#0088FF] cursor-pointer transition-colors"
                >
                  <FaReply className="text-[9px]" />
                  Reply
                </button>
              )}

              {isLoggedIn && comment.authorId === currentUserId && (
                <button
                  onClick={() => startEdit(comment)}
                  className="flex items-center gap-[3px] text-[11px] text-[#9CA3AF] hover:text-[#0088FF] cursor-pointer transition-colors"
                >
                  <FaPen className="text-[9px]" />
                  Edit
                </button>
              )}

              {isLoggedIn && comment.authorId === currentUserId && (
                <button
                  disabled={submitting}
                  onClick={() => setConfirmDeleteId(comment._id)}
                  className="flex items-center gap-[3px] text-[11px] text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer transition-colors disabled:opacity-50"
                >
                  <FaTrash className="text-[9px]" />
                  Delete
                </button>
              )}

              {isLoggedIn && comment.authorId !== currentUserId && (
                <button
                  onClick={() => { setReportModal(comment._id); reportForm.reset(); }}
                  className="flex items-center gap-[3px] text-[11px] text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer transition-colors"
                >
                  <FaFlag className="text-[9px]" />
                  Report
                </button>
              )}
            </div>

            {/* Reply form */}
            {replyTo?.id === comment._id && (
              <div className="mt-[8px] pl-[32px]">
                <div className="text-[11px] text-[#6B7280] mb-[4px]">
                  Replying to <span className="font-[600]">{replyTo.name}</span>
                </div>
                <textarea
                  {...replyForm.register("content")}
                  placeholder="Write a reply..."
                  rows={2}
                  maxLength={2000}
                  className={`w-full border ${replyForm.formState.errors.content ? "border-red-400" : "border-[#E5E7EB]"} rounded-[8px] px-[10px] py-[6px] text-[12px] focus:border-[#0088FF] outline-none resize-none`}
                />
                <div className="flex items-center gap-[6px] mt-[4px]">
                  <button
                    onClick={replyForm.handleSubmit(onSubmitReply)}
                    disabled={submitting}
                    className="h-[26px] px-[12px] rounded-[6px] bg-[#0088FF] text-white text-[11px] font-[500] hover:bg-[#006FCC] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => { setReplyTo(null); replyForm.reset(); }}
                    className="h-[26px] px-[12px] rounded-[6px] border border-[#E5E7EB] text-[#666] text-[11px] font-[500] hover:bg-[#F9F9F9] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <label className="flex items-center gap-[3px] text-[11px] text-[#6B7280] cursor-pointer ml-auto select-none">
                    <input
                      type="checkbox"
                      {...replyForm.register("isAnonymous")}
                      className="w-[13px] h-[13px] accent-[#0088FF] cursor-pointer"
                    />
                    <FaUserSecret className="text-[9px]" />
                    Anonymous
                  </label>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {!isReply && (
        <div className="py-[14px]">
          {/* Header */}
          <div className="flex items-center gap-[10px] mb-[8px]">
            <div className="w-[28px] h-[28px] rounded-full bg-[#E5E5E5] flex items-center justify-center shrink-0">
              {comment.isAnonymous ? (
                <FaUserSecret className="text-[10px] text-[#999]" />
              ) : (
                <FaUser className="text-[10px] text-[#999]" />
              )}
            </div>
            <div>
              <span className={`font-[600] text-[13px] ${comment.isAnonymous ? "text-[#9CA3AF] italic" : "text-[#111827]"}`}>
                {comment.isAnonymous ? "Anonymous" : comment.authorName}
              </span>
              <span className="text-[12px] text-[#9CA3AF] ml-[8px]">{fmtDate(comment.createdAt)}</span>
              {comment.isEdited && (
                <span className="text-[11px] text-[#C0C4CC] italic ml-[6px]">(edited)</span>
              )}
            </div>
          </div>

          {/* Content or Edit form */}
          {editingId === comment._id ? (
            <div className="pl-[38px] mb-[8px]">
              <textarea
                {...editForm.register("content")}
                rows={3}
                maxLength={2000}
                className={`w-full border ${editForm.formState.errors.content ? "border-red-400" : "border-[#E5E7EB]"} rounded-[10px] px-[12px] py-[8px] text-[13px] focus:border-[#0088FF] outline-none resize-none`}
              />
              <div className="flex items-center gap-[8px] mt-[6px]">
                <button
                  onClick={editForm.handleSubmit(onSubmitEdit)}
                  disabled={submitting}
                  className="h-[30px] px-[14px] rounded-[6px] bg-[#0088FF] text-white text-[12px] font-[500] hover:bg-[#006FCC] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="h-[30px] px-[14px] rounded-[6px] border border-[#E5E7EB] text-[#666] text-[12px] font-[500] hover:bg-[#F9F9F9] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <span className="text-[11px] text-[#9CA3AF] ml-auto">{editForm.watch("content")?.length || 0}/2000</span>
              </div>
            </div>
          ) : (
            <div
              className="text-[14px] text-[#374151] mb-[8px] pl-[38px]"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(comment.content) }}
            />
          )}

          {/* Actions */}
          <div className="flex items-center gap-[12px] pl-[38px]">
            <button
              onClick={() => handleHelpful(comment._id)}
              className="flex items-center gap-[4px] text-[12px] text-[#9CA3AF] hover:text-[#0088FF] cursor-pointer transition-colors"
            >
              <FaThumbsUp className="text-[10px]" />
              {comment.helpfulCount > 0 ? comment.helpfulCount : "Helpful"}
            </button>

            {isLoggedIn && (
              <button
                onClick={() => {
                  if (replyTo?.id === comment._id) {
                    setReplyTo(null);
                    replyForm.reset();
                  } else {
                    setReplyTo({ id: comment._id, name: comment.authorName });
                    replyForm.reset({ content: "", isAnonymous: false });
                  }
                }}
                className="flex items-center gap-[4px] text-[12px] text-[#9CA3AF] hover:text-[#0088FF] cursor-pointer transition-colors"
              >
                <FaReply className="text-[10px]" />
                Reply
              </button>
            )}

            {isLoggedIn && comment.authorId === currentUserId && (
              <button
                onClick={() => startEdit(comment)}
                className="flex items-center gap-[4px] text-[12px] text-[#9CA3AF] hover:text-[#0088FF] cursor-pointer transition-colors"
              >
                <FaPen className="text-[10px]" />
                Edit
              </button>
            )}

            {isLoggedIn && comment.authorId === currentUserId && (
              <button
                disabled={submitting}
                onClick={() => setConfirmDeleteId(comment._id)}
                className="flex items-center gap-[4px] text-[12px] text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer transition-colors disabled:opacity-50"
              >
                <FaTrash className="text-[10px]" />
                Delete
              </button>
            )}

            {isLoggedIn && comment.authorId !== currentUserId && (
              <button
                onClick={() => { setReportModal(comment._id); reportForm.reset(); }}
                className="flex items-center gap-[4px] text-[12px] text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer transition-colors"
              >
                <FaFlag className="text-[10px]" />
                Report
              </button>
            )}
          </div>

          {/* Reply form */}
          {replyTo?.id === comment._id && (
            <div className="mt-[10px] pl-[38px]">
              <div className="text-[12px] text-[#6B7280] mb-[6px]">
                Replying to <span className="font-[600]">{replyTo.name}</span>
              </div>
              <textarea
                {...replyForm.register("content")}
                placeholder="Write a reply..."
                rows={2}
                maxLength={2000}
                className={`w-full border ${replyForm.formState.errors.content ? "border-red-400" : "border-[#E5E7EB]"} rounded-[8px] px-[12px] py-[8px] text-[13px] focus:border-[#0088FF] outline-none resize-none`}
              />
              <div className="flex items-center gap-[8px] mt-[6px]">
                <button
                  onClick={replyForm.handleSubmit(onSubmitReply)}
                  disabled={submitting}
                  className="h-[30px] px-[14px] rounded-[6px] bg-[#0088FF] text-white text-[12px] font-[500] hover:bg-[#006FCC] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Reply
                </button>
                <button
                  onClick={() => { setReplyTo(null); replyForm.reset(); }}
                  className="h-[30px] px-[14px] rounded-[6px] border border-[#E5E7EB] text-[#666] text-[12px] font-[500] hover:bg-[#F9F9F9] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <label className="flex items-center gap-[4px] text-[12px] text-[#6B7280] cursor-pointer ml-auto select-none">
                  <input
                    type="checkbox"
                    {...replyForm.register("isAnonymous")}
                    className="w-[14px] h-[14px] accent-[#0088FF] cursor-pointer"
                  />
                  <FaUserSecret className="text-[10px]" />
                  Anonymous
                </label>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nested replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map((reply) => renderComment(reply, depth + 1))}
        </div>
      )}
    </div>
    );
  };

  return (
    <div className="mt-[32px] border-t border-[#E5E7EB] pt-[24px]">
      <h2 className="text-[18px] font-[700] text-[#111827] mb-[16px]">
        Comments {!loading && totalComments > 0 && `(${totalComments})`}
      </h2>

      {/* New comment form */}
      {isLoggedIn && (
        <div className="mb-[24px]">
          <textarea
            {...mainForm.register("content")}
            placeholder="Share your thoughts..."
            rows={3}
            maxLength={2000}
            className={`w-full border ${mainForm.formState.errors.content ? "border-red-400" : "border-[#E5E7EB]"} rounded-[10px] px-[14px] py-[10px] text-[14px] focus:border-[#0088FF] outline-none resize-none`}
          />
          <div className="flex items-center justify-between mt-[8px]">
            <div className="flex items-center gap-[12px]">
              <span className="text-[12px] text-[#9CA3AF]">{mainForm.watch("content")?.length || 0}/2000</span>
              <label className="flex items-center gap-[4px] text-[12px] text-[#6B7280] cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...mainForm.register("isAnonymous")}
                  className="w-[14px] h-[14px] accent-[#0088FF] cursor-pointer"
                />
                <FaUserSecret className="text-[10px]" />
                Anonymous
              </label>
            </div>
            <button
              onClick={mainForm.handleSubmit(onSubmitComment)}
              disabled={submitting}
              className="h-[34px] px-[18px] rounded-[8px] bg-[#0088FF] text-white text-[13px] font-[500] hover:bg-[#006FCC] transition-all disabled:opacity-50 cursor-pointer"
            >
              Post Comment
            </button>
          </div>
        </div>
      )}

      {!isLoggedIn && (
        <p className="text-[14px] text-[#9CA3AF] mb-[16px]">Login as a verified student to comment.</p>
      )}

      {/* Comments list */}
      {loading ? (
        <div className="space-y-[12px]">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="flex items-center gap-[10px] mb-[8px]">
                <div className="w-[28px] h-[28px] rounded-full bg-gray-200" />
                <div className="h-[14px] w-[120px] bg-gray-200 rounded" />
              </div>
              <div className="h-[14px] w-full bg-gray-200 rounded ml-[38px]" />
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-[14px] text-[#9CA3AF] text-center py-[24px]">No comments yet. Be the first!</p>
      ) : (
        <div className="divide-y divide-[#F0F0F0]">
          {comments.map((c) => renderComment(c))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-[8px] mt-[16px] justify-center">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => fetchComments(p)}
              className={`w-[32px] h-[32px] rounded-[6px] text-[12px] font-[500] cursor-pointer transition-all ${
                page === p ? "bg-[#0088FF] text-white" : "border border-[#E5E7EB] text-[#666] hover:border-[#0088FF]"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-[12px] p-[24px] w-full max-w-[400px] mx-[20px] shadow-xl">
            <h3 className="font-[700] text-[16px] text-[#111827] mb-[8px]">Delete Comment</h3>
            <p className="text-[14px] text-[#6B7280] mb-[20px]">Are you sure you want to delete this comment? This cannot be undone.</p>
            <div className="flex gap-[10px]">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 h-[38px] border border-[#E5E7EB] rounded-[8px] text-[13px] font-[500] text-[#6B7280] hover:bg-[#F5F7FA] transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}
                className="flex-1 h-[38px] bg-red-500 rounded-[8px] text-[13px] font-[600] text-white hover:bg-red-600 transition-colors cursor-pointer disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Comment Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-[12px] p-[24px] w-full max-w-[440px] mx-[20px] shadow-xl">
            <h3 className="font-[700] text-[18px] text-[#121212] mb-[8px]">Report Comment</h3>
            <p className="text-[14px] text-[#666] mb-[16px]">
              Please describe why this comment is inappropriate.
            </p>
            <textarea
              {...reportForm.register("reason")}
              placeholder="Reason for reporting (at least 5 characters)..."
              rows={4}
              maxLength={500}
              className={`w-full border ${reportForm.formState.errors.reason ? "border-red-400" : "border-[#DEDEDE]"} rounded-[8px] px-[12px] py-[10px] text-[14px] focus:border-[#0088FF] outline-none resize-none`}
            />
            <div className="flex justify-between mt-[4px] mb-[16px]">
              {reportForm.formState.errors.reason ? (
                <p className="text-[12px] text-red-500">{reportForm.formState.errors.reason.message}</p>
              ) : <div />}
              <span className="text-[12px] text-[#9CA3AF]">
                {reportForm.watch("reason")?.length || 0}/500
              </span>
            </div>
            <div className="flex gap-[12px]">
              <button
                onClick={() => { setReportModal(null); reportForm.reset(); }}
                className="flex-1 h-[44px] border border-[#DEDEDE] rounded-[8px] font-[600] text-[#666] hover:bg-[#F9F9F9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={reportForm.handleSubmit(onSubmitReport)}
                disabled={submitting}
                className="flex-1 h-[44px] bg-[#EF4444] rounded-[8px] font-[600] text-white hover:bg-[#DC2626] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
