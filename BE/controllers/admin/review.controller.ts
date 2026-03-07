import { Response } from "express";
import Review from "../../models/review.model";
import Report from "../../models/report.model";
import ExperienceComment from "../../models/experience-comment.model";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import Notification from "../../models/notification.model";
import { notifyCandidate } from "../../helpers/socket.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";

// List reviews (admin)
export const listReviews = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.reports; // reuse reports page size
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const filter: any = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) filter.status = status;
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ];
    }

    const skip = (page - 1) * pageSize;
    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .select("companyId candidateId isAnonymous overallRating title content pros cons status isEdited createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    // Batch fetch company + candidate names
    const companyIds = [...new Set(reviews.map((r: any) => r.companyId.toString()))];
    const candidateIds = [...new Set(reviews.map((r: any) => r.candidateId.toString()))];
    const [companies, candidates] = await Promise.all([
      AccountCompany.find({ _id: { $in: companyIds } }).select("companyName").lean(),
      AccountCandidate.find({ _id: { $in: candidateIds } }).select("fullName").lean(),
    ]);
    const companyMap = new Map(companies.map((c: any) => [c._id.toString(), c.companyName]));
    const candidateMap = new Map(candidates.map((c: any) => [c._id.toString(), c.fullName]));

    const reviewsWithDetails = reviews.map((r: any) => ({
      ...r,
      companyName: companyMap.get(r.companyId.toString()) || "Unknown",
      candidateName: r.isAnonymous ? "Anonymous" : (candidateMap.get(r.candidateId.toString()) || "Unknown"),
    }));

    res.json({
      code: "success",
      reviews: reviewsWithDetails,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / pageSize)),
        currentPage: page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Admin list reviews error:", error);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

// Update review status (approve/reject)
export const updateReviewStatus = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ code: "error", message: "Invalid status. Must be 'approved' or 'rejected'." });
      return;
    }

    const review = await Review.findByIdAndUpdate(id, { status }, { new: false }).select("candidateId title status companyId").lean();
    if (!review) {
      res.status(404).json({ code: "error", message: "Review not found." });
      return;
    }

    // Skip notification if status didn't change (idempotent update)
    if ((review as any).status === status) {
      await invalidateJobDiscoveryCaches();
      res.json({ code: "success", message: status === "approved" ? "Review approved." : "Review rejected." });
      return;
    }

    // Notify candidate
    if (review.candidateId) {
      const company = (review as any).companyId
        ? await AccountCompany.findById((review as any).companyId, "slug").lean()
        : null;
      const reviewLink = company ? `/company/detail/${(company as any).slug}` : `/company/list`;
      const notif = await Notification.create({
        candidateId: review.candidateId,
        type: "other" as const,
        title: status === "approved" ? "Review Approved!" : "Review Not Approved",
        message: status === "approved"
          ? `Your review "${(review as any).title}" has been approved and is now visible.`
          : `Your review "${(review as any).title}" was not approved.`,
        link: reviewLink,
        read: false,
      });
      notifyCandidate(review.candidateId.toString(), notif);
    }

    // Invalidate company list/top companies cache (review stats affect avgRating/reviewCount)
    await invalidateJobDiscoveryCaches();

    res.json({ code: "success", message: status === "approved" ? "Review approved." : "Review rejected." });
  } catch (error) {
    console.error("Admin update review status error:", error);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const deleteReview = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const result = await Review.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      res.status(404).json({ code: "error", message: "Review not found." });
      return;
    }
    // Also clean up reports targeting this review
    await Report.deleteMany({ targetType: "review", targetId: id });

    // Invalidate company list/top companies cache (review stats changed)
    await invalidateJobDiscoveryCaches();

    res.json({ code: "success", message: "Review deleted." });
  } catch (error) {
    console.error("Admin delete review error:", error);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

// List reports
export const listReports = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.reports;
    const status = req.query.status as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const filter: any = {};
    if (status && ["pending", "resolved", "dismissed"].includes(status)) filter.status = status;
    if (targetType && ["review", "comment"].includes(targetType)) filter.targetType = targetType;

    if (keyword) {
      // Pre-lookup: find reporter IDs and target IDs matching keyword
      const [matchedCandidates, matchedCompanies, matchedReviews, matchedComments] = await Promise.all([
        AccountCandidate.find({ fullName: { $regex: keyword, $options: "i" } }).select("_id").lean(),
        AccountCompany.find({ companyName: { $regex: keyword, $options: "i" } }).select("_id").lean(),
        Review.find({ $or: [{ title: { $regex: keyword, $options: "i" } }, { content: { $regex: keyword, $options: "i" } }] }).select("_id").lean(),
        ExperienceComment.find({ content: { $regex: keyword, $options: "i" } }).select("_id").lean(),
      ]);

      const reporterIds = [
        ...matchedCandidates.map((c: any) => c._id),
        ...matchedCompanies.map((c: any) => c._id),
      ];
      const targetIds = [
        ...matchedReviews.map((r: any) => r._id),
        ...matchedComments.map((c: any) => c._id),
      ];

      const orConditions: any[] = [
        { reason: { $regex: keyword, $options: "i" } },
      ];
      if (reporterIds.length > 0) orConditions.push({ reporterId: { $in: reporterIds } });
      if (targetIds.length > 0) orConditions.push({ targetId: { $in: targetIds } });

      filter.$or = orConditions;
    }

    const skip = (page - 1) * pageSize;
    const [total, reports] = await Promise.all([
      Report.countDocuments(filter),
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    // Attach reporter names
    const candidateReporterIds = reports.filter((r: any) => r.reporterType === "candidate").map((r: any) => r.reporterId);
    const companyReporterIds = reports.filter((r: any) => r.reporterType === "company").map((r: any) => r.reporterId);

    const [reporterCandidates, reporterCompanies] = await Promise.all([
      AccountCandidate.find({ _id: { $in: candidateReporterIds } }).select("fullName").lean(),
      AccountCompany.find({ _id: { $in: companyReporterIds } }).select("companyName").lean(),
    ]);
    const candidateNameMap = new Map(reporterCandidates.map((c: any) => [c._id.toString(), c.fullName]));
    const companyNameMap = new Map(reporterCompanies.map((c: any) => [c._id.toString(), c.companyName]));

    // Batch fetch target content (eliminates N+1)
    const reviewTargetIds = reports.filter((r: any) => r.targetType === "review").map((r: any) => r.targetId);
    const commentTargetIds = reports.filter((r: any) => r.targetType === "comment").map((r: any) => r.targetId);
    const [reviewTargets, commentTargets] = await Promise.all([
      reviewTargetIds.length > 0 ? Review.find({ _id: { $in: reviewTargetIds } }).select("title content").lean() : [],
      commentTargetIds.length > 0 ? ExperienceComment.find({ _id: { $in: commentTargetIds } }).select("content deleted").lean() : [],
    ]);
    const reviewTargetMap = new Map(reviewTargets.map((r: any) => [r._id.toString(), r]));
    const commentTargetMap = new Map(commentTargets.map((c: any) => [c._id.toString(), c]));

    const reportsWithDetails = reports.map((r: any) => {
      let reporterName: string;
      if (r.reporterType === "guest") {
        reporterName = "Guest";
      } else if (r.reporterType === "candidate") {
        reporterName = candidateNameMap.get(r.reporterId?.toString()) || "Unknown";
      } else {
        reporterName = companyNameMap.get(r.reporterId?.toString()) || "Unknown";
      }

      let targetContent: string | null = null;
      let targetTitle: string | null = null;
      let targetDeleted = false;

      if (r.targetType === "review") {
        const review = reviewTargetMap.get(r.targetId?.toString());
        if (review) {
          targetTitle = (review as any).title || null;
          targetContent = (review as any).content || null;
        } else {
          targetDeleted = true;
        }
      } else if (r.targetType === "comment") {
        const comment = commentTargetMap.get(r.targetId?.toString());
        if (comment) {
          targetContent = (comment as any).content || null;
          targetDeleted = !!(comment as any).deleted;
        } else {
          targetDeleted = true;
        }
      }

      return { ...r, reporterName, targetContent, targetTitle, targetDeleted };
    });

    res.json({
      code: "success",
      reports: reportsWithDetails,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / pageSize)),
        currentPage: page,
        pageSize,
      },
    });
  } catch (error) {
    console.error("Admin list reports error:", error);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const updateReportStatus = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["resolved", "dismissed"].includes(status)) {
      res.status(400).json({ code: "error", message: "Invalid status." });
      return;
    }
    const report = await Report.findByIdAndUpdate(id, { status }, { new: true });
    if (!report) {
      res.status(404).json({ code: "error", message: "Report not found." });
      return;
    }
    res.json({ code: "success", message: `Report ${status}.` });
  } catch (error) {
    console.error("Admin update report status error:", error);
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
