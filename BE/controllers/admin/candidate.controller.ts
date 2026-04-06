import { Response } from "express";
import AccountCandidate from "../../models/account-candidate.model";
import CV from "../../models/cv.model";
import SavedJob from "../../models/saved-job.model";
import FollowCompany from "../../models/follow-company.model";
import Review from "../../models/review.model";
import Report from "../../models/report.model";
import Notification from "../../models/notification.model";
import InterviewExperience from "../../models/interview-experience.model";
import ExperienceComment from "../../models/experience-comment.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches, invalidateExperienceCaches } from "../../helpers/cache-invalidation.helper";
import { recountJobApplications } from "../../helpers/job-recount.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { notifyCandidate } from "../../helpers/socket.helper";
import { adminPaginationConfig } from "../../config/variable";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.candidates;
    const skip = (page - 1) * pageSize;
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();
    const verified = req.query.verified as string | undefined;

    const filter: any = {};
    if (status && ["active", "inactive"].includes(status)) filter.status = status;
    if (verified === "true") filter.isVerified = true;
    if (verified === "false") filter.isVerified = false;
    if (keyword) filter.$or = [
      { fullName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { studentId: { $regex: keyword, $options: "i" } },
      { cohort: { $regex: keyword, $options: "i" } },
      { major: { $regex: keyword, $options: "i" } },
    ];

    const [total, candidates] = await Promise.all([
      AccountCandidate.countDocuments(filter),
      AccountCandidate.find(filter)
        .select("fullName email phone studentId cohort major isVerified status createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      code: "success",
      candidates,
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

export const setVerified = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;
    if (typeof isVerified !== "boolean") {
      res.status(400).json({ code: "error", message: "isVerified must be a boolean." });
      return;
    }
    const candidate = await AccountCandidate.findOneAndUpdate(
      { _id: id },
      { isVerified },
      { new: false }
    ).select("email fullName isVerified").lean();
    if (!candidate) {
      res.status(404).json({ code: "error", message: "Candidate not found." });
      return;
    }
    // Send email + real-time noti only when transitioning to verified
    if (isVerified && !(candidate as any).isVerified) {
      const { subject, html } = emailTemplates.studentVerified((candidate as any).fullName || "Student");
      void sendEmail((candidate as any).email, subject, html).catch(() => {});
      const notif = await Notification.create({
        candidateId: (candidate as any)._id,
        type: "other" as const,
        title: "Account Verified!",
        message: "Your student account has been verified. You now have full access to all features.",
        link: "/candidate-manage/profile",
        read: false,
      });
      notifyCandidate(id, notif);
    }
    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: isVerified ? "candidate.verify" : "candidate.unverify",
      targetId: id,
      targetType: "AccountCandidate",
      detail: { email: (candidate as any).email },
    });
    res.json({ code: "success", message: isVerified ? "Student verified." : "Verification removed." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const setStatus = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["active", "inactive"].includes(status)) {
      res.status(400).json({ code: "error", message: "Invalid status." });
      return;
    }

    const candidate = await AccountCandidate.findById(id).select("email status").lean();
    if (!candidate) {
      res.status(404).json({ code: "error", message: "Candidate not found." });
      return;
    }

    // Skip if status is already the same
    if ((candidate as any).status === status) {
      res.json({ code: "success", message: status === "inactive" ? "Candidate already banned." : "Candidate already active." });
      return;
    }

    // Atomically update status + recount in a single transaction (race-condition proof)
    const cvs = await CV.find({ email: (candidate as any).email }).select("jobId").lean();
    const affectedJobIds = cvs.length > 0
      ? [...new Set(cvs.map((cv: any) => cv.jobId?.toString()).filter(Boolean))]
      : [];

    if (affectedJobIds.length > 0) {
      await recountJobApplications(affectedJobIds, {
        preOps: async (session) => {
          await AccountCandidate.updateOne({ _id: id }, { status }).session(session);
        },
      });
    } else {
      await AccountCandidate.updateOne({ _id: id }, { status });
    }

    // Invalidate all cached content affected by candidate visibility change
    // (job counts, company list/top companies review stats, experience posts)
    await Promise.all([
      invalidateJobDiscoveryCaches(),
      invalidateExperienceCaches(),
    ]);

    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: status === "inactive" ? "candidate.ban" : "candidate.unban",
      targetId: id,
      targetType: "AccountCandidate",
      detail: { email: (candidate as any).email, status },
    });
    res.json({ code: "success", message: status === "inactive" ? "Candidate banned." : "Candidate unbanned." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const deleteCandidate = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const candidate = await AccountCandidate.findById(id).select("avatar email").lean();
    if (!candidate) {
      res.status(404).json({ code: "error", message: "Candidate not found." });
      return;
    }

    // Delete avatar from Cloudinary
    if ((candidate as any).avatar) {
      void deleteImage((candidate as any).avatar).catch((err) => console.error('[Cloudinary] Failed to delete:', err));
    }

    // Collect affected job IDs and delete CV files before removing CVs
    const cvs = await CV.find({ email: (candidate as any).email }).select("jobId fileCV").lean();
    const affectedJobIds = [...new Set(cvs.map((cv: any) => cv.jobId?.toString()).filter(Boolean))];

    // Delete CV files from Cloudinary
    await Promise.allSettled(cvs.map((cv: any) => cv.fileCV ? deleteImage(cv.fileCV) : Promise.resolve()));

    // Delete CVs and related data
    await CV.deleteMany({ email: (candidate as any).email });

    // Atomically recount applicationCount/approvedCount for affected jobs (transaction-safe)
    if (affectedJobIds.length > 0) {
      await recountJobApplications(affectedJobIds, { excludeCandidateId: id });
      await invalidateJobDiscoveryCaches();
    }

    // Clean up reviews and their reports
    const reviewIds = await Review.find({ candidateId: id }).select("_id").lean();
    await Review.deleteMany({ candidateId: id });
    if (reviewIds.length > 0) {
      await Report.deleteMany({ targetType: "review", targetId: { $in: reviewIds.map((r: any) => r._id) } });
    }
    // Clean up reports submitted by this candidate
    await Report.deleteMany({ reporterId: id, reporterType: "candidate" });

    // Clean up interview experiences and all comments on them (including from other users)
    const experiences = await InterviewExperience.find({ authorId: id }).select("_id").lean();
    // Collect comment IDs before deletion for report cleanup
    const deletedCommentDocs = await ExperienceComment.find({
      $or: [
        { authorId: id },
        ...(experiences.length > 0 ? [{ experienceId: { $in: experiences.map((e: any) => e._id) } }] : []),
      ],
    }).select("_id").lean();
    await Promise.allSettled([
      SavedJob.deleteMany({ candidateId: id }),
      FollowCompany.deleteMany({ candidateId: id }),
      Notification.deleteMany({ candidateId: id }),
      InterviewExperience.deleteMany({ authorId: id }),
      ExperienceComment.deleteMany({ authorId: id }),
      ...(experiences.length > 0 ? [ExperienceComment.deleteMany({ experienceId: { $in: experiences.map((e: any) => e._id) } })] : []),
      ...(deletedCommentDocs.length > 0 ? [Report.deleteMany({ targetType: "comment", targetId: { $in: deletedCommentDocs.map((c: any) => c._id) } })] : []),
    ]);

    // Delete the candidate account
    await AccountCandidate.deleteOne({ _id: id });

    logAdminAction({
      actorId: req.admin._id.toString(),
      actorEmail: req.admin.email,
      action: "candidate.delete",
      targetId: id,
      targetType: "AccountCandidate",
      detail: { email: (candidate as any).email },
    });
    res.json({ code: "success", message: "Candidate and all associated data deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
