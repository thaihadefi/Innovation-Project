"use client";
import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";
import { FaThumbsUp, FaReply, FaTrash, FaFlag, FaUser, FaUserSecret, FaPen } from "react-icons/fa6";

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
  const [newComment, setNewComment] = useState("");
  const [newCommentAnonymous, setNewCommentAnonymous] = useState(false);
  const [replyTo, setReplyTo] = useState<{ id: string; name: string } | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [replyAnonymous, setReplyAnonymous] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reportModal, setReportModal] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

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
        `${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${postId}/comments?page=${p}`
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

  const handleSubmitComment = async () => {
    if (!isLoggedIn) {
      toast.info("Please login to comment.");
      return;
    }
    if (!newComment.trim()) return;
    if (newComment.trim().length > 2000) {
      toast.error("Comment must not exceed 2000 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment.trim(), isAnonymous: newCommentAnonymous }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.code === "success") {
        toast.success("Comment posted.");
        setNewComment("");
        setNewCommentAnonymous(false);
        fetchComments(1);
      } else {
        toast.error(data.message || "Failed to post comment.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitReply = async (parentId: string) => {
    if (!isLoggedIn) {
      toast.info("Please login to reply.");
      return;
    }
    if (!replyContent.trim()) return;
    if (replyContent.trim().length > 2000) {
      toast.error("Reply must not exceed 2000 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent.trim(), parentId, isAnonymous: replyAnonymous }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.code === "success") {
        toast.success("Reply posted.");
        setReplyTo(null);
        setReplyContent("");
        setReplyAnonymous(false);
        fetchComments(page);
      } else {
        toast.error(data.message || "Failed to post reply.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
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
    }
  };

  const startEdit = (comment: Comment) => {
    setEditingId(comment._id);
    setEditContent(comment.content);
    // Close reply form if open
    setReplyTo(null);
    setReplyContent("");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditContent("");
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;
    if (editContent.trim().length > 2000) {
      toast.error("Comment must not exceed 2000 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editContent.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.code === "success") {
        toast.success("Comment updated.");
        // Update in state without refetching
        const updateCommentContent = (list: Comment[]): Comment[] =>
          list.map((c) => {
            if (c._id === commentId) {
              return { ...c, content: data.comment.content, isEdited: true };
            }
            if (c.replies) {
              return { ...c, replies: updateCommentContent(c.replies) };
            }
            return c;
          });
        setComments(updateCommentContent);
        cancelEdit();
      } else {
        toast.error(data.message || "Failed to update.");
      }
    } catch {
      toast.error("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleHelpful = async (commentId: string) => {
    if (!isLoggedIn) {
      toast.info("Please login to mark as helpful.");
      return;
    }
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
    }
  };

  const handleReport = async () => {
    if (!reportModal || !reportReason.trim() || reportReason.trim().length < 5) {
      toast.error("Reason must be at least 5 characters.");
      return;
    }
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/interview-experiences/comments/${reportModal}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reportReason.trim() }),
        credentials: "include",
      });
      const data = await res.json();
      if (data.code === "success") {
        toast.success(data.message);
      } else {
        toast.error(data.message || "Failed to submit report.");
      }
    } catch {
      toast.error("Network error.");
    }
    setReportModal(null);
    setReportReason("");
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
                  {comment.authorName}
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
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={2}
                  maxLength={2000}
                  className="w-full border border-[#E5E7EB] rounded-[8px] px-[10px] py-[6px] text-[12px] focus:border-[#0088FF] outline-none resize-none"
                />
                <div className="flex items-center gap-[6px] mt-[4px]">
                  <button
                    onClick={() => handleEdit(comment._id)}
                    disabled={submitting || !editContent.trim()}
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
                  <span className="text-[10px] text-[#9CA3AF] ml-auto">{editContent.length}/2000</span>
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
                      setReplyTo(null); setReplyContent(""); setReplyAnonymous(false);
                    } else {
                      setReplyTo({ id: comment._id, name: comment.authorName }); setReplyContent(""); setReplyAnonymous(false);
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
                  onClick={() => handleDelete(comment._id)}
                  className="flex items-center gap-[3px] text-[11px] text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer transition-colors"
                >
                  <FaTrash className="text-[9px]" />
                  Delete
                </button>
              )}

              {isLoggedIn && comment.authorId !== currentUserId && (
                <button
                  onClick={() => { setReportModal(comment._id); setReportReason(""); }}
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
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write a reply..."
                  rows={2}
                  maxLength={2000}
                  className="w-full border border-[#E5E7EB] rounded-[8px] px-[10px] py-[6px] text-[12px] focus:border-[#0088FF] outline-none resize-none"
                />
                <div className="flex items-center gap-[6px] mt-[4px]">
                  <button
                    onClick={() => handleSubmitReply(comment._id)}
                    disabled={submitting || !replyContent.trim()}
                    className="h-[26px] px-[12px] rounded-[6px] bg-[#0088FF] text-white text-[11px] font-[500] hover:bg-[#006FCC] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    Reply
                  </button>
                  <button
                    onClick={() => { setReplyTo(null); setReplyContent(""); setReplyAnonymous(false); }}
                    className="h-[26px] px-[12px] rounded-[6px] border border-[#E5E7EB] text-[#666] text-[11px] font-[500] hover:bg-[#F9F9F9] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <label className="flex items-center gap-[3px] text-[11px] text-[#6B7280] cursor-pointer ml-auto select-none">
                    <input
                      type="checkbox"
                      checked={replyAnonymous}
                      onChange={(e) => setReplyAnonymous(e.target.checked)}
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
                {comment.authorName}
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
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                maxLength={2000}
                className="w-full border border-[#E5E7EB] rounded-[10px] px-[12px] py-[8px] text-[13px] focus:border-[#0088FF] outline-none resize-none"
              />
              <div className="flex items-center gap-[8px] mt-[6px]">
                <button
                  onClick={() => handleEdit(comment._id)}
                  disabled={submitting || !editContent.trim()}
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
                <span className="text-[11px] text-[#9CA3AF] ml-auto">{editContent.length}/2000</span>
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
                    setReplyTo(null); setReplyContent(""); setReplyAnonymous(false);
                  } else {
                    setReplyTo({ id: comment._id, name: comment.authorName }); setReplyContent(""); setReplyAnonymous(false);
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
                onClick={() => handleDelete(comment._id)}
                className="flex items-center gap-[4px] text-[12px] text-[#9CA3AF] hover:text-[#EF4444] cursor-pointer transition-colors"
              >
                <FaTrash className="text-[10px]" />
                Delete
              </button>
            )}

            {isLoggedIn && comment.authorId !== currentUserId && (
              <button
                onClick={() => { setReportModal(comment._id); setReportReason(""); }}
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
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write a reply..."
                rows={2}
                maxLength={2000}
                className="w-full border border-[#E5E7EB] rounded-[8px] px-[12px] py-[8px] text-[13px] focus:border-[#0088FF] outline-none resize-none"
              />
              <div className="flex items-center gap-[8px] mt-[6px]">
                <button
                  onClick={() => handleSubmitReply(comment._id)}
                  disabled={submitting || !replyContent.trim()}
                  className="h-[30px] px-[14px] rounded-[6px] bg-[#0088FF] text-white text-[12px] font-[500] hover:bg-[#006FCC] transition-all disabled:opacity-50 cursor-pointer"
                >
                  Reply
                </button>
                <button
                  onClick={() => { setReplyTo(null); setReplyContent(""); setReplyAnonymous(false); }}
                  className="h-[30px] px-[14px] rounded-[6px] border border-[#E5E7EB] text-[#666] text-[12px] font-[500] hover:bg-[#F9F9F9] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <label className="flex items-center gap-[4px] text-[12px] text-[#6B7280] cursor-pointer ml-auto select-none">
                  <input
                    type="checkbox"
                    checked={replyAnonymous}
                    onChange={(e) => setReplyAnonymous(e.target.checked)}
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
        Comments {!loading && comments.length > 0 && `(${comments.length})`}
      </h2>

      {/* New comment form */}
      {isLoggedIn && (
        <div className="mb-[24px]">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts..."
            rows={3}
            maxLength={2000}
            className="w-full border border-[#E5E7EB] rounded-[10px] px-[14px] py-[10px] text-[14px] focus:border-[#0088FF] outline-none resize-none"
          />
          <div className="flex items-center justify-between mt-[8px]">
            <div className="flex items-center gap-[12px]">
              <span className="text-[12px] text-[#9CA3AF]">{newComment.length}/2000</span>
              <label className="flex items-center gap-[4px] text-[12px] text-[#6B7280] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newCommentAnonymous}
                  onChange={(e) => setNewCommentAnonymous(e.target.checked)}
                  className="w-[14px] h-[14px] accent-[#0088FF] cursor-pointer"
                />
                <FaUserSecret className="text-[10px]" />
                Anonymous
              </label>
            </div>
            <button
              onClick={handleSubmitComment}
              disabled={submitting || !newComment.trim()}
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

      {/* Report Comment Modal */}
      {reportModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-[12px] p-[24px] w-full max-w-[440px] mx-[20px] shadow-xl">
            <h3 className="font-[700] text-[18px] text-[#121212] mb-[8px]">Report Comment</h3>
            <p className="text-[14px] text-[#666] mb-[16px]">
              Please describe why this comment is inappropriate.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason for reporting (at least 5 characters)..."
              rows={4}
              maxLength={500}
              className="w-full border border-[#DEDEDE] rounded-[8px] px-[12px] py-[10px] text-[14px] focus:border-[#0088FF] outline-none resize-none"
            />
            <div className="text-right text-[12px] text-[#9CA3AF] mt-[4px] mb-[16px]">
              {reportReason.length}/500
            </div>
            <div className="flex gap-[12px]">
              <button
                onClick={() => { setReportModal(null); setReportReason(""); }}
                className="flex-1 h-[44px] border border-[#DEDEDE] rounded-[8px] font-[600] text-[#666] hover:bg-[#F9F9F9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReport}
                disabled={reportReason.trim().length < 5}
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
