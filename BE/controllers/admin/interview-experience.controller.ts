import { Response } from "express";
import InterviewExperience from "../../models/interview-experience.model";
import ExperienceComment from "../../models/experience-comment.model";
import Report from "../../models/report.model";
import Notification from "../../models/notification.model";
import { notifyCandidate } from "../../helpers/socket.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { invalidateExperienceCaches } from "../../helpers/cache-invalidation.helper";
import { adminPaginationConfig } from "../../config/variable";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.experiences;
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const filter: any = { deleted: false };
    if (status && ["pending", "approved", "rejected"].includes(status)) filter.status = status;
    if (keyword) filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { companyName: { $regex: keyword, $options: "i" } },
      { authorName: { $regex: keyword, $options: "i" } },
      { position: { $regex: keyword, $options: "i" } },
    ];

    const skip = (page - 1) * pageSize;
    const [total, posts] = await Promise.all([
      InterviewExperience.countDocuments(filter),
      InterviewExperience.find(filter)
        .select("title companyName position result difficulty authorName isAnonymous status isEdited content createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      code: "success",
      posts,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / pageSize)),
        currentPage: page,
        pageSize,
      },
    });
  } catch (err) {
    console.error("Admin list experiences error:", err);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const updateStatus = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ code: "error", message: "Invalid status. Must be 'approved' or 'rejected'." });
      return;
    }
    const post = await InterviewExperience.findOneAndUpdate(
      { _id: id, deleted: false },
      { status },
      { new: false }
    ).select("authorId title status").lean();
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found." });
      return;
    }

    // Skip notification if status didn't change (idempotent update)
    if ((post as any).status === status) {
      await invalidateExperienceCaches(id);
      res.json({ code: "success", message: status === "approved" ? "Post approved." : "Post rejected." });
      return;
    }

    // Send real-time notification + email to candidate
    if (post.authorId) {
      const notif = await Notification.create({
        candidateId: post.authorId,
        type: status === "approved" ? "experience_approved" : "experience_rejected",
        title: status === "approved" ? "Post Approved!" : "Post Not Approved",
        message: status === "approved"
          ? `Your interview experience "${post.title}" has been approved and is now visible to others.`
          : `Your interview experience "${post.title}" was not approved. You may edit and resubmit.`,
        link: `/candidate-manage/interview-preparation/experiences`,
        read: false,
      });
      notifyCandidate(post.authorId.toString(), notif);
    }

    // Invalidate public list cache — approved/rejected changes visibility
    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: status === "approved" ? "experience.approve" : "experience.reject",
      targetId: id,
      targetType: "InterviewExperience",
      detail: { title: (post as any).title },
    });
    await invalidateExperienceCaches(id);
    res.json({ code: "success", message: status === "approved" ? "Post approved." : "Post rejected." });
  } catch (err) {
    console.error("Admin updateStatus experience error:", err);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const remove = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const post = await InterviewExperience.findOneAndUpdate({ _id: id, deleted: false }, { deleted: true }).select("title authorName").lean();
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found." });
      return;
    }

    // Cascade: soft-delete all comments on this post and resolve their reports
    const commentDocs = await ExperienceComment.find({ experienceId: id, deleted: false }).select("_id").lean();
    if (commentDocs.length > 0) {
      await ExperienceComment.updateMany({ experienceId: id, deleted: false }, { deleted: true });
      await Report.updateMany(
        { targetType: "comment", targetId: { $in: commentDocs.map((c: any) => c._id) } },
        { status: "resolved" }
      );
    }

    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: "experience.delete",
      targetId: id,
      targetType: "InterviewExperience",
      detail: { title: (post as any).title, authorName: (post as any).authorName },
    });
    await invalidateExperienceCaches(id);
    res.json({ code: "success", message: "Post deleted." });
  } catch (err) {
    console.error("Admin remove experience error:", err);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const deleteComment = async (req: RequestAdmin, res: Response) => {
  try {
    const { commentId } = req.params;
    const comment = await ExperienceComment.findOne({ _id: commentId, deleted: false });
    if (!comment) {
      res.status(404).json({ code: "error", message: "Comment not found." });
      return;
    }

    comment.deleted = true;
    await comment.save();

    // Also soft-delete replies if top-level comment
    let replyIds: any[] = [];
    let replyCount = 0;
    if (!comment.parentId) {
      // Fetch reply IDs before soft-deleting so we can clean up their reports too
      const replyDocs = await ExperienceComment.find(
        { parentId: commentId, deleted: false }
      ).select("_id").lean();
      replyIds = replyDocs.map((r: any) => r._id);

      const deletedReplies = await ExperienceComment.updateMany(
        { parentId: commentId, deleted: false },
        { deleted: true }
      );
      replyCount = deletedReplies.modifiedCount;
    }

    // Decrement comment count for both the deleted comment and its replies in one atomic op
    const totalDecrement = 1 + replyCount;
    await InterviewExperience.updateOne(
      { _id: comment.experienceId, commentCount: { $gte: totalDecrement } },
      { $inc: { commentCount: -totalDecrement } }
    );

    // Mark reports for the deleted comment and cascade-deleted replies as resolved
    const allTargetIds = [commentId, ...replyIds];
    await Report.updateMany(
      { targetType: "comment", targetId: { $in: allTargetIds } },
      { status: "resolved" }
    );

    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: "experience.comment_delete",
      targetId: commentId,
      targetType: "ExperienceComment",
      detail: { experienceId: comment.experienceId?.toString(), repliesDeleted: replyCount },
    });
    res.json({ code: "success", message: "Comment deleted." });
  } catch (err) {
    console.error("Admin deleteComment experience error:", err);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
