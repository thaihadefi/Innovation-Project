import { Response } from "express";
import InterviewExperience from "../../models/interview-experience.model";
import ExperienceComment from "../../models/experience-comment.model";
import Report from "../../models/report.model";
import Notification from "../../models/notification.model";
import AccountCandidate from "../../models/account-candidate.model";
import { notifyCandidate } from "../../helpers/socket.helper";
import { queueEmail } from "../../helpers/queue.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { RequestAdmin } from "../../interfaces/request.interface";

const PAGE_SIZE = 10;

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
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

    const skip = (page - 1) * PAGE_SIZE;
    const [total, posts] = await Promise.all([
      InterviewExperience.countDocuments(filter),
      InterviewExperience.find(filter)
        .select("title companyName position result difficulty authorName isAnonymous status content createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
    ]);

    res.json({
      code: "success",
      posts,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        currentPage: page,
        pageSize: PAGE_SIZE,
      },
    });
  } catch {
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
    ).select("authorId title").lean();
    if (!post) {
      res.status(404).json({ code: "error", message: "Post not found." });
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

      // Email candidate (best practice: email confirms moderation decision)
      const candidate = await AccountCandidate.findById(post.authorId).select("email").lean();
      if (candidate?.email) {
        const { subject, html } = status === "approved"
          ? emailTemplates.experienceApproved(post.title)
          : emailTemplates.experienceRejected(post.title);
        queueEmail(candidate.email, subject, html);
      }
    }

    res.json({ code: "success", message: status === "approved" ? "Post approved." : "Post rejected." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const remove = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const result = await InterviewExperience.updateOne({ _id: id, deleted: false }, { deleted: true });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Post not found." });
      return;
    }
    res.json({ code: "success", message: "Post deleted." });
  } catch {
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

    // Decrement comment count
    await InterviewExperience.updateOne(
      { _id: comment.experienceId },
      { $inc: { commentCount: -1 } }
    );

    // Also soft-delete replies if top-level comment
    if (!comment.parentId) {
      const deletedReplies = await ExperienceComment.updateMany(
        { parentId: commentId, deleted: false },
        { deleted: true }
      );
      if (deletedReplies.modifiedCount > 0) {
        await InterviewExperience.updateOne(
          { _id: comment.experienceId },
          { $inc: { commentCount: -deletedReplies.modifiedCount } }
        );
      }
    }

    // Clean up reports targeting this comment
    await Report.deleteMany({ targetType: "comment", targetId: commentId });

    res.json({ code: "success", message: "Comment deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
