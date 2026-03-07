import { Response } from "express";
import mongoose from "mongoose";
import AccountCandidate from "../../models/account-candidate.model";
import CV from "../../models/cv.model";
import Job from "../../models/job.model";
import SavedJob from "../../models/saved-job.model";
import FollowCompany from "../../models/follow-company.model";
import Review from "../../models/review.model";
import Notification from "../../models/notification.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";

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
      { phone: { $regex: keyword, $options: "i" } },
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
    const result = await AccountCandidate.updateOne({ _id: id }, { isVerified });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Candidate not found." });
      return;
    }
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

    await AccountCandidate.updateOne({ _id: id }, { status });

    // Recount applicationCount/approvedCount for affected jobs
    // This approach is race-condition proof: always derives counts from actual data
    const cvs = await CV.find({ email: (candidate as any).email }).select("jobId").lean();
    if (cvs.length > 0) {
      const affectedJobIds = [...new Set(cvs.map((cv: any) => cv.jobId?.toString()).filter(Boolean))];

      // Get all banned candidate emails (after the status change)
      const bannedCandidates = await AccountCandidate.find({ status: "inactive" }).select("email").lean();
      const bannedEmails = new Set(bannedCandidates.map((c: any) => c.email));

      // Recount each affected job from actual CV data
      const bulkOps = await Promise.all(
        affectedJobIds.map(async (jobId) => {
          const jobCvs = await CV.find({ jobId }).select("email status").lean();
          // Only count CVs from non-banned candidates
          const activeCvs = jobCvs.filter((cv: any) => !bannedEmails.has(cv.email));
          const applicationCount = activeCvs.length;
          const approvedCount = activeCvs.filter((cv: any) => cv.status === "approved").length;

          return {
            updateOne: {
              filter: { _id: new mongoose.Types.ObjectId(jobId) },
              update: { $set: { applicationCount, approvedCount } },
            },
          };
        })
      );

      if (bulkOps.length > 0) {
        await Job.bulkWrite(bulkOps);
        invalidateJobDiscoveryCaches();
      }
    }

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
      await deleteImage((candidate as any).avatar).catch(() => {});
    }

    // Collect affected job IDs and delete CV files before removing CVs
    const cvs = await CV.find({ email: (candidate as any).email }).select("jobId fileCV").lean();
    const affectedJobIds = [...new Set(cvs.map((cv: any) => cv.jobId?.toString()).filter(Boolean))];

    // Delete CV files from Cloudinary
    await Promise.allSettled(cvs.map((cv: any) => cv.fileCV ? deleteImage(cv.fileCV) : Promise.resolve()));

    // Delete CVs and related data
    await CV.deleteMany({ email: (candidate as any).email });

    // Recount applicationCount/approvedCount for affected jobs after CV deletion
    if (affectedJobIds.length > 0) {
      const bannedCandidates = await AccountCandidate.find({
        status: "inactive",
        _id: { $ne: id }, // exclude the candidate being deleted
      }).select("email").lean();
      const bannedEmails = new Set(bannedCandidates.map((c: any) => c.email));

      const bulkOps = await Promise.all(
        affectedJobIds.map(async (jobId) => {
          const jobCvs = await CV.find({ jobId }).select("email status").lean();
          const activeCvs = jobCvs.filter((cv: any) => !bannedEmails.has(cv.email));
          return {
            updateOne: {
              filter: { _id: new mongoose.Types.ObjectId(jobId) },
              update: { $set: { applicationCount: activeCvs.length, approvedCount: activeCvs.filter((cv: any) => cv.status === "approved").length } },
            },
          };
        })
      );
      if (bulkOps.length > 0) {
        await Job.bulkWrite(bulkOps);
        invalidateJobDiscoveryCaches();
      }
    }

    // Clean up related data
    await Promise.allSettled([
      SavedJob.deleteMany({ candidateId: id }),
      FollowCompany.deleteMany({ candidateId: id }),
      Review.deleteMany({ candidateId: id }),
      Notification.deleteMany({ candidateId: id }),
    ]);

    // Delete the candidate account
    await AccountCandidate.deleteOne({ _id: id });

    res.json({ code: "success", message: "Candidate and all associated data deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
