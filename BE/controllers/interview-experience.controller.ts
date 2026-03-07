import { Request, Response } from "express";
import mongoose from "mongoose";
import InterviewExperience from "../models/interview-experience.model";
import ExperienceComment from "../models/experience-comment.model";
import Report from "../models/report.model";
import AccountAdmin from "../models/account-admin.model";
import Notification from "../models/notification.model";
import Role from "../models/role.model";
import { queueEmail } from "../helpers/queue.helper";
import { emailTemplates } from "../helpers/email-template.helper";
import { notifyAdmin, notifyCandidate } from "../helpers/socket.helper";
import { RequestAccount } from "../interfaces/request.interface";
import cache, { CACHE_TTL } from "../helpers/cache.helper";
import { invalidateExperienceCaches } from "../helpers/cache-invalidation.helper";

const PAGE_SIZE = 10;

export const list = async (req: Request, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const keyword = String(req.query.keyword || "").trim();
    const result = req.query.result as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;

    const cacheKey = `experiences:list:${page}:${keyword}:${result || ""}:${difficulty || ""}`;
    const cached = await cache.getAsync<object>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const filter: any = { status: "approved", deleted: false };
    if (keyword) filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
      { companyName: { $regex: keyword, $options: "i" } },
      { position: { $regex: keyword, $options: "i" } },
    ];
    if (result && ["passed", "failed", "pending"].includes(result)) filter.result = result;
    if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) filter.difficulty = difficulty;

    const skip = (page - 1) * PAGE_SIZE;
    const [total, posts] = await Promise.all([
      InterviewExperience.countDocuments(filter),
      InterviewExperience.find(filter)
        .select("title companyName position result difficulty authorName isAnonymous helpfulCount commentCount createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
    ]);

    const payload = {
      code: "success",
      posts,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        currentPage: page,
        pageSize: PAGE_SIZE,
      },
    };
    cache.set(cacheKey, payload, CACHE_TTL.DYNAMIC);
    res.json(payload);
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const detail = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cacheKey = `experiences:detail:${id}`;
    const cached = await cache.getAsync<object>(cacheKey);
    if (cached) {
      res.json(cached);
      return;
    }

    const post = await InterviewExperience.findOne({
      _id: id,
      status: "approved",
      deleted: false,
    }).select("-__v -deleted").lean();

    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found." });
      return;
    }

    const payload = { code: "success", post };
    cache.set(cacheKey, payload, CACHE_TTL.DYNAMIC);
    res.json(payload);
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const update = async (req: RequestAccount, res: Response) => {
  try {
    const { id } = req.params;
    const { title, content, companyName, position, result, difficulty, isAnonymous } = req.body;
    const post = await InterviewExperience.findOne({ _id: id, authorId: req.account._id, deleted: false });
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found or access denied." });
      return;
    }
    const wasApproved = post.status === "approved";
    post.title = title;
    post.content = content;
    post.companyName = companyName;
    post.position = position;
    post.result = result;
    post.difficulty = difficulty;
    post.isAnonymous = !!isAnonymous;
    post.status = "pending";
    await post.save();
    // If the post was approved, it's now removed from the public list
    if (wasApproved) await invalidateExperienceCaches(id);
    res.json({ code: "success", message: "Post updated and pending re-review." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const remove = async (req: RequestAccount, res: Response) => {
  try {
    const { id } = req.params;
    const post = await InterviewExperience.findOneAndUpdate(
      { _id: id, authorId: req.account._id, deleted: false },
      { $set: { deleted: true } }
    ).select("status").lean();
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found or access denied." });
      return;
    }
    if (post.status === "approved") await invalidateExperienceCaches(id);
    res.json({ code: "success", message: "Post deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const create = async (req: RequestAccount, res: Response) => {
  try {
    const { title, content, companyName, position, result, difficulty, isAnonymous } = req.body;
    const post = new InterviewExperience({
      title,
      content,
      companyName,
      position,
      result: result || "pending",
      difficulty,
      authorId: req.account._id,
      authorName: req.account.fullName,
      isAnonymous: !!isAnonymous,
      status: "pending",
    });
    await post.save();

    // Notify admins with experiences_manage permission (fire-and-forget)
    (async () => {
      try {
        const roles = await Role.find({ permissions: "experiences_manage" }).select("_id").lean();
        const roleIds = roles.map((r: any) => r._id);
        const admins = await AccountAdmin.find({
          status: "active",
          deleted: false,
          $or: [{ isSuperAdmin: true }, { role: { $in: roleIds } }],
        }).select("email").lean();

        const notifDocs = admins.map((admin: any) => ({
          adminId: admin._id,
          type: "other" as const,
          title: "New Interview Experience Submitted",
          message: `${req.account.fullName} submitted "${title}" — pending review.`,
          link: "/admin-manage/interview-experiences",
          read: false,
        }));
        if (notifDocs.length > 0) {
          const inserted = await Notification.insertMany(notifDocs);
          // Push real-time via socket to each admin
          inserted.forEach((notif: any) => {
            notifyAdmin(notif.adminId.toString(), notif);
          });
        }

        const { subject, html } = emailTemplates.experienceSubmittedAdmin(req.account.fullName, title);
        admins.forEach((admin: any) => queueEmail(admin.email, subject, html));
      } catch {
        // Non-critical — do not affect response
      }
    })();

    res.json({ code: "success", message: "Your post has been submitted and is pending review." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

// ─── Helpful toggle for experience post ──────────────────────────────────────
export const markHelpful = async (req: RequestAccount, res: Response) => {
  try {
    const { id } = req.params;
    const candidateId = req.account._id;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ code: "error", message: "Invalid post ID." });
      return;
    }

    const post = await InterviewExperience.findOne({ _id: id, status: "approved", deleted: false })
      .select("helpfulVotes helpfulCount authorId title");
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found." });
      return;
    }

    const hasVoted = post.helpfulVotes.includes(candidateId);
    if (hasVoted) {
      post.helpfulVotes = post.helpfulVotes.filter(
        (v: any) => v.toString() !== candidateId.toString()
      );
      post.helpfulCount = Math.max(0, (post.helpfulCount || 0) - 1);
    } else {
      post.helpfulVotes.push(candidateId);
      post.helpfulCount = (post.helpfulCount || 0) + 1;

      // Notify post author (if not self)
      if (post.authorId && post.authorId.toString() !== candidateId.toString()) {
        (async () => {
          try {
            const notif = await Notification.create({
              candidateId: post.authorId,
              type: "other" as const,
              title: "Someone found your post helpful!",
              message: `Your interview experience "${post.title}" was marked as helpful.`,
              link: `/candidate-manage/interview-preparation/experiences/${id}`,
              read: false,
            });
            notifyCandidate(post.authorId.toString(), notif);
          } catch { /* non-critical */ }
        })();
      }
    }
    await post.save();

    res.json({
      code: "success",
      isHelpful: !hasVoted,
      helpfulCount: post.helpfulCount,
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

// ─── Comments ─────────────────────────────────────────────────────────────────
export const getComments = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // experienceId
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = 20;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ code: "error", message: "Invalid post ID." });
      return;
    }

    // Check post exists and is approved
    const post = await InterviewExperience.findOne({ _id: id, status: "approved", deleted: false }).select("_id").lean();
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found." });
      return;
    }

    const filter = { experienceId: id, parentId: null, deleted: false };
    const skip = (page - 1) * pageSize;

    const [total, comments] = await Promise.all([
      ExperienceComment.countDocuments(filter),
      ExperienceComment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    // Fetch ALL replies under these top-level comments (replies have parentId set to top-level)
    const commentIds = comments.map((c: any) => c._id);
    const replies = await ExperienceComment.find({
      parentId: { $in: commentIds },
      deleted: false,
    })
      .sort({ createdAt: 1 })
      .lean();

    // Group replies by parentId
    const repliesMap = new Map<string, any[]>();
    replies.forEach((r: any) => {
      const key = r.parentId.toString();
      if (!repliesMap.has(key)) repliesMap.set(key, []);
      repliesMap.get(key)!.push(r);
    });

    // Mask anonymous names
    const maskComment = (c: any) => ({
      ...c,
      authorName: c.isAnonymous ? "Anonymous" : c.authorName,
    });

    const commentsWithReplies = comments.map((c: any) => ({
      ...maskComment(c),
      replies: (repliesMap.get(c._id.toString()) || []).map(maskComment),
    }));

    res.json({
      code: "success",
      comments: commentsWithReplies,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / pageSize)),
        currentPage: page,
        pageSize,
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const createComment = async (req: RequestAccount, res: Response) => {
  try {
    const { id } = req.params; // experienceId
    const { content, parentId, isAnonymous } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ code: "error", message: "Invalid post ID." });
      return;
    }
    if (!content || typeof content !== "string" || content.trim().length < 1) {
      res.status(400).json({ code: "error", message: "Comment content is required." });
      return;
    }
    if (content.trim().length > 2000) {
      res.status(400).json({ code: "error", message: "Comment must not exceed 2000 characters." });
      return;
    }

    const post = await InterviewExperience.findOne({ _id: id, status: "approved", deleted: false }).select("_id commentCount authorId title");
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found." });
      return;
    }

    let rootParentId: any = null;
    let replyToId: any = null;
    let replyToName: string | null = null;

    // If replying, validate parent comment exists
    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        res.status(400).json({ code: "error", message: "Invalid parent comment ID." });
        return;
      }
      const parent = await ExperienceComment.findOne({ _id: parentId, experienceId: id, deleted: false })
        .select("_id parentId authorId authorName isAnonymous")
        .lean();
      if (!parent) {
        res.status(404).json({ code: "error", message: "Parent comment not found." });
        return;
      }

      // If parent is top-level, parentId = parent._id; if parent is a reply, parentId = parent.parentId (root)
      if (parent.parentId) {
        // Replying to a reply — flatten to root thread
        rootParentId = parent.parentId;
        replyToId = parent._id;
        replyToName = parent.isAnonymous ? "Anonymous" : parent.authorName;
      } else {
        // Replying to a top-level comment
        rootParentId = parent._id;
        replyToId = parent._id;
        replyToName = parent.isAnonymous ? "Anonymous" : parent.authorName;
      }
    }

    const comment = await ExperienceComment.create({
      experienceId: id,
      authorId: req.account._id,
      authorName: req.account.fullName,
      isAnonymous: !!isAnonymous,
      content: content.trim(),
      parentId: rootParentId,
      replyToId,
      replyToName,
    });

    // Increment comment count on post (atomic to avoid race conditions)
    await InterviewExperience.updateOne({ _id: post._id }, { $inc: { commentCount: 1 } });

    // Notifications (fire-and-forget, no email)
    (async () => {
      try {
        const actorName = isAnonymous ? "Someone" : req.account.fullName;
        const postLink = `/candidate-manage/interview-preparation/experiences/${id}`;
        const notifiedSet = new Set<string>(); // track who we already notified

        // 1. Notify post author on ANY new comment/reply (not self)
        if (post.authorId && post.authorId.toString() !== req.account._id.toString()) {
          const notif = await Notification.create({
            candidateId: post.authorId,
            type: "other" as const,
            title: parentId ? "New reply on your post" : "New comment on your post",
            message: `${actorName} ${parentId ? "replied on" : "commented on"} your post "${post.title}".`,
            link: postLink,
            read: false,
          });
          notifyCandidate(post.authorId.toString(), notif);
          notifiedSet.add(post.authorId.toString());
        }

        // 2. Notify the comment author being replied to (if reply, not self, not already notified)
        if (replyToId) {
          const repliedComment = await ExperienceComment.findById(replyToId).select("authorId").lean();
          if (
            repliedComment &&
            repliedComment.authorId.toString() !== req.account._id.toString() &&
            !notifiedSet.has(repliedComment.authorId.toString())
          ) {
            const notif = await Notification.create({
              candidateId: repliedComment.authorId,
              type: "other" as const,
              title: "New reply to your comment",
              message: `${actorName} replied to your comment on "${post.title}".`,
              link: postLink,
              read: false,
            });
            notifyCandidate(repliedComment.authorId.toString(), notif);
          }
        }
      } catch { /* non-critical */ }
    })();

    // Return masked name if anonymous
    const returnComment = {
      ...comment.toObject(),
      authorName: isAnonymous ? "Anonymous" : req.account.fullName,
    };

    res.json({
      code: "success",
      message: "Comment posted.",
      comment: returnComment,
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const editComment = async (req: RequestAccount, res: Response) => {
  try {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ code: "error", message: "Invalid comment ID." });
      return;
    }
    if (!content || typeof content !== "string" || content.trim().length < 1) {
      res.status(400).json({ code: "error", message: "Comment content is required." });
      return;
    }
    if (content.trim().length > 2000) {
      res.status(400).json({ code: "error", message: "Comment must not exceed 2000 characters." });
      return;
    }

    const comment = await ExperienceComment.findOne({ _id: commentId, deleted: false });
    if (!comment) {
      res.status(404).json({ code: "error", message: "Comment not found." });
      return;
    }

    if (comment.authorId.toString() !== req.account._id.toString()) {
      res.status(403).json({ code: "error", message: "You can only edit your own comments." });
      return;
    }

    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();

    res.json({
      code: "success",
      message: "Comment updated.",
      comment: {
        ...comment.toObject(),
        authorName: comment.isAnonymous ? "Anonymous" : comment.authorName,
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const deleteComment = async (req: RequestAccount, res: Response) => {
  try {
    const { commentId } = req.params;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ code: "error", message: "Invalid comment ID." });
      return;
    }

    const comment = await ExperienceComment.findOne({ _id: commentId, deleted: false });
    if (!comment) {
      res.status(404).json({ code: "error", message: "Comment not found." });
      return;
    }

    if (comment.authorId.toString() !== req.account._id.toString()) {
      res.status(403).json({ code: "error", message: "You can only delete your own comments." });
      return;
    }

    comment.deleted = true;
    await comment.save();

    // Decrement comment count
    await InterviewExperience.updateOne(
      { _id: comment.experienceId },
      { $inc: { commentCount: -1 } }
    );

    // Clean up reports targeting this comment
    await Report.deleteMany({ targetType: "comment", targetId: commentId });

    // Also soft-delete replies if this is a top-level comment
    if (!comment.parentId) {
      // Collect reply IDs before soft-deleting so we can clean up their reports
      const replyDocs = await ExperienceComment.find(
        { parentId: commentId, deleted: false },
        { _id: 1 }
      ).lean();

      const deletedReplies = await ExperienceComment.updateMany(
        { parentId: commentId, deleted: false },
        { deleted: true }
      );
      if (deletedReplies.modifiedCount > 0) {
        await InterviewExperience.updateOne(
          { _id: comment.experienceId },
          { $inc: { commentCount: -deletedReplies.modifiedCount } }
        );
        // Clean up reports for cascade-deleted replies
        if (replyDocs.length > 0) {
          await Report.deleteMany({
            targetType: "comment",
            targetId: { $in: replyDocs.map((r: any) => r._id) },
          });
        }
      }
    }

    res.json({ code: "success", message: "Comment deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const markCommentHelpful = async (req: RequestAccount, res: Response) => {
  try {
    const { commentId } = req.params;
    const candidateId = req.account._id;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ code: "error", message: "Invalid comment ID." });
      return;
    }

    const comment = await ExperienceComment.findOne({ _id: commentId, deleted: false })
      .select("helpfulVotes helpfulCount authorId experienceId");
    if (!comment) {
      res.status(404).json({ code: "error", message: "Comment not found." });
      return;
    }

    const hasVoted = comment.helpfulVotes.includes(candidateId);
    if (hasVoted) {
      comment.helpfulVotes = comment.helpfulVotes.filter(
        (v: any) => v.toString() !== candidateId.toString()
      );
      comment.helpfulCount = Math.max(0, (comment.helpfulCount || 0) - 1);
    } else {
      comment.helpfulVotes.push(candidateId);
      comment.helpfulCount = (comment.helpfulCount || 0) + 1;

      // Notify comment author (if not self)
      if (comment.authorId && comment.authorId.toString() !== candidateId.toString()) {
        (async () => {
          try {
            const notif = await Notification.create({
              candidateId: comment.authorId,
              type: "other" as const,
              title: "Someone found your comment helpful!",
              message: `Your comment was marked as helpful.`,
              link: `/candidate-manage/interview-preparation/experiences/${comment.experienceId}`,
              read: false,
            });
            notifyCandidate(comment.authorId.toString(), notif);
          } catch { /* non-critical */ }
        })();
      }
    }
    await comment.save();

    res.json({
      code: "success",
      isHelpful: !hasVoted,
      helpfulCount: comment.helpfulCount,
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const reportComment = async (req: RequestAccount, res: Response) => {
  try {
    const { commentId } = req.params;
    const { reason } = req.body;
    const candidateId = req.account._id;

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      res.status(400).json({ code: "error", message: "Invalid comment ID." });
      return;
    }
    if (!reason || typeof reason !== "string" || reason.trim().length < 5) {
      res.status(400).json({ code: "error", message: "Reason must be at least 5 characters." });
      return;
    }
    if (reason.trim().length > 500) {
      res.status(400).json({ code: "error", message: "Reason must not exceed 500 characters." });
      return;
    }

    const comment = await ExperienceComment.findOne({ _id: commentId, deleted: false }).select("_id content").lean();
    if (!comment) {
      res.status(404).json({ code: "error", message: "Comment not found." });
      return;
    }

    const existing = await Report.findOne({
      targetType: "comment",
      targetId: commentId,
      reporterId: candidateId,
    }).lean();
    if (existing) {
      res.status(409).json({ code: "error", message: "You have already reported this comment." });
      return;
    }

    await Report.create({
      targetType: "comment",
      targetId: commentId,
      reporterId: candidateId,
      reporterType: "candidate",
      reason: reason.trim(),
    });

    // Notify admins (no email)
    (async () => {
      try {
        const roles = await Role.find({
          $or: [
            { permissions: "experiences_manage" },
            { permissions: "reports_manage" },
          ],
        }).select("_id").lean();
        const roleIds = roles.map((r: any) => r._id);
        const admins = await AccountAdmin.find({
          status: "active",
          deleted: false,
          $or: [{ isSuperAdmin: true }, { role: { $in: roleIds } }],
        }).select("_id").lean();

        const notifDocs = admins.map((admin: any) => ({
          adminId: admin._id,
          type: "other" as const,
          title: "Comment Reported",
          message: `A comment has been reported: ${reason.trim().slice(0, 80)}`,
          link: "/admin-manage/reports",
          read: false,
        }));
        if (notifDocs.length > 0) {
          const inserted = await Notification.insertMany(notifDocs);
          inserted.forEach((notif: any) => {
            notifyAdmin(notif.adminId.toString(), notif);
          });
        }
      } catch {
        // Non-critical
      }
    })();

    res.json({ code: "success", message: "Report submitted. Thank you!" });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
