import { Response } from "express";
import mongoose from "mongoose";
import { RequestAccount } from "../interfaces/request.interface";
import Review from "../models/review.model";
import { sanitizeRichText } from "../helpers/sanitize-rich-text.helper";
import Report from "../models/report.model";
import AccountCompany from "../models/account-company.model";
import AccountCandidate from "../models/account-candidate.model";
import AccountAdmin from "../models/account-admin.model";
import Notification from "../models/notification.model";
import Role from "../models/role.model";
import { notifyAdmin, notifyCandidate } from "../helpers/socket.helper";
import { invalidateJobDiscoveryCaches } from "../helpers/cache-invalidation.helper";
import { getBannedCandidateIds } from "../helpers/banned-candidates.helper";
import { paginationConfig } from "../config/variable";

// Create a review
export const createReview = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account._id;
    const { companyId, isAnonymous, overallRating, ratings, title, content, pros, cons } = req.body;

    // Only verified UIT students/alumni can write reviews
    if (!req.account.isVerified) {
      res.status(403).json({ code: "error", message: "Only verified UIT students and alumni can write reviews." });
      return;
    }

    // Validate companyId format
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      res.status(400).json({ code: "error", message: "Invalid company ID." });
      return;
    }

    const company = await AccountCompany.findById(companyId).select("_id status").lean();
    if (!company) {
      res.status(404).json({ code: "error", message: "Company not found" });
      return;
    }
    if ((company as any).status !== "active") {
      res.status(400).json({ code: "error", message: "Cannot review this company." });
      return;
    }

    if (!title || typeof title !== "string" || title.trim().length < 5) {
      res.status(400).json({ code: "error", message: "Review title must be at least 5 characters" });
      return;
    }
    if (title.trim().length > 100) {
      res.status(400).json({ code: "error", message: "Review title must be at most 100 characters" });
      return;
    }
    if (!content || typeof content !== "string" || content.trim().length < 20) {
      res.status(400).json({ code: "error", message: "Review content must be at least 20 characters" });
      return;
    }
    if (content.trim().length > 5000) {
      res.status(400).json({ code: "error", message: "Review content must not exceed 5000 characters" });
      return;
    }
    if (pros && typeof pros === "string" && pros.trim().length > 2000) {
      res.status(400).json({ code: "error", message: "Pros must not exceed 2000 characters" });
      return;
    }
    if (cons && typeof cons === "string" && cons.trim().length > 2000) {
      res.status(400).json({ code: "error", message: "Cons must not exceed 2000 characters" });
      return;
    }
    const ratingNum = Number(overallRating);
    if (!overallRating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ code: "error", message: "Overall rating must be between 1 and 5" });
      return;
    }

    const existingReview = await Review.findOne({ companyId, candidateId, deleted: false }).select("_id").lean();
    if (existingReview) {
      res.status(409).json({ code: "error", message: "You have already reviewed this company" });
      return;
    }

    const review = new Review({
      companyId,
      candidateId,
      isAnonymous: isAnonymous !== false,
      overallRating: Math.min(5, Math.max(1, parseInt(overallRating) || 3)),
      ratings: {
        salary: ratings?.salary ? Math.min(5, Math.max(1, parseInt(ratings.salary))) : null,
        workLifeBalance: ratings?.workLifeBalance
          ? Math.min(5, Math.max(1, parseInt(ratings.workLifeBalance)))
          : null,
        career: ratings?.career ? Math.min(5, Math.max(1, parseInt(ratings.career))) : null,
        culture: ratings?.culture ? Math.min(5, Math.max(1, parseInt(ratings.culture))) : null,
        management: ratings?.management ? Math.min(5, Math.max(1, parseInt(ratings.management))) : null
      },
      title: title.trim(),
      content: sanitizeRichText(content),
      pros: sanitizeRichText(pros),
      cons: sanitizeRichText(cons),
    });

    await review.save();

    // Invalidate company list/top companies cache (review stats changed)
    await invalidateJobDiscoveryCaches();

    res.json({
      code: "success",
      message: "Review submitted successfully.",
      review: {
        id: review._id,
        title: review.title,
        overallRating: review.overallRating
      }
    });
  } catch (error) {
    console.error("Create review error:", error);
    res.status(500).json({ code: "error", message: "Failed to submit review" });
  }
};

// Get reviews for a company
export const getCompanyReviews = async (req: RequestAccount<{ companyId: string }>, res: Response) => {
  try {
    const companyId = req.params.companyId;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = paginationConfig.companyReviews;
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      res.status(400).json({ code: "error", message: "Invalid company ID" });
      return;
    }

    // Soft-hide reviews from banned candidates
    const bannedIds = await getBannedCandidateIds();
    const reviewFilter: any = { companyId, status: "approved", deleted: false };
    if (bannedIds.length > 0) {
      reviewFilter.candidateId = { $nin: bannedIds };
    }

    const reviews = await Review.find(reviewFilter)
      .select("candidateId isAnonymous overallRating ratings title content pros cons helpfulCount isEdited createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const nonAnonReviews = reviews.filter((r: any) => !r.isAnonymous);
    const candidateIds = nonAnonReviews.map((r: any) => r.candidateId);
    const candidates = await AccountCandidate.find({ _id: { $in: candidateIds } })
      .select("fullName avatar")
      .lean();
    const candidateMap = new Map(candidates.map((c: any) => [c._id.toString(), c]));

    const reviewsWithAuthor = reviews.map((review: any) => {
      let authorName = "Anonymous";
      let authorAvatar = null;

      if (!review.isAnonymous) {
        const candidate = candidateMap.get(review.candidateId.toString());
        if (candidate) {
          authorName = candidate.fullName || "User";
          authorAvatar = candidate.avatar;
        }
      }

      return {
        id: review._id,
        candidateId: review.candidateId.toString(),
        overallRating: review.overallRating,
        ratings: review.ratings,
        title: review.title,
        content: review.content,
        pros: review.pros,
        cons: review.cons,
        authorName,
        authorAvatar,
        isAnonymous: review.isAnonymous,
        helpfulCount: review.helpfulCount || 0,
        isEdited: review.isEdited || false,
        createdAt: review.createdAt
      };
    });

    const statsMatch: any = { companyId: new mongoose.Types.ObjectId(companyId), status: "approved", deleted: false };
    if (bannedIds.length > 0) {
      statsMatch.candidateId = { $nin: bannedIds.map((id: string) => new mongoose.Types.ObjectId(id)) };
    }

    const stats = await Review.aggregate([
      { $match: statsMatch },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          avgOverall: { $avg: "$overallRating" },
          avgSalary: { $avg: "$ratings.salary" },
          avgWorkLifeBalance: { $avg: "$ratings.workLifeBalance" },
          avgCareer: { $avg: "$ratings.career" },
          avgCulture: { $avg: "$ratings.culture" },
          avgManagement: { $avg: "$ratings.management" }
        }
      }
    ]);

    const totalReviews = stats[0]?.totalReviews || 0;
    const totalPages = Math.ceil(totalReviews / limit);

    res.json({
      code: "success",
      reviews: reviewsWithAuthor,
      stats: stats[0]
        ? {
            totalReviews: stats[0].totalReviews,
            avgOverall: Math.round(stats[0].avgOverall * 10) / 10,
            avgSalary: stats[0].avgSalary ? Math.round(stats[0].avgSalary * 10) / 10 : null,
            avgWorkLifeBalance: stats[0].avgWorkLifeBalance
              ? Math.round(stats[0].avgWorkLifeBalance * 10) / 10
              : null,
            avgCareer: stats[0].avgCareer ? Math.round(stats[0].avgCareer * 10) / 10 : null,
            avgCulture: stats[0].avgCulture ? Math.round(stats[0].avgCulture * 10) / 10 : null,
            avgManagement: stats[0].avgManagement ? Math.round(stats[0].avgManagement * 10) / 10 : null
          }
        : null,
      pagination: {
        currentPage: page,
        totalPages,
        totalReviews
      }
    });
  } catch (error) {
    console.error("Get company reviews error:", error);
    res.status(500).json({ code: "error", message: "Failed to get reviews" });
  }
};

// Mark review as helpful
export const markHelpful = async (req: RequestAccount, res: Response) => {
  try {
    if (req.accountType !== "candidate") {
      res.status(403).json({ code: "error", message: "Only candidates can mark reviews as helpful" });
      return;
    }
    if (!req.account.isVerified) {
      res.status(403).json({ code: "error", message: "Only verified UIT students and alumni can manage reviews." });
      return;
    }

    const candidateId = req.account._id;
    const { reviewId } = req.params;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ code: "error", message: "Invalid review ID." });
      return;
    }

    // Block self-voting with a clear error message
    const review = await Review.findOne({ _id: reviewId, status: "approved", deleted: false }).select("candidateId").lean();
    if (!review) {
      res.status(404).json({ code: "error", message: "Review not found." });
      return;
    }
    if ((review as any).candidateId?.toString() === candidateId.toString()) {
      res.status(400).json({ code: "error", message: "Cannot mark your own review as helpful." });
      return;
    }

    // Try to add vote atomically (only approved reviews, no self-vote, not already voted)
    const added = await Review.findOneAndUpdate(
      { _id: reviewId, status: "approved", deleted: false, candidateId: { $ne: candidateId }, helpfulVotes: { $ne: candidateId } },
      { $addToSet: { helpfulVotes: candidateId }, $inc: { helpfulCount: 1 } },
      { new: true, select: "helpfulCount candidateId title companyId" }
    ).lean();

    if (added) {
      // Notify review author (fire-and-forget, if not self)
      if ((added as any).candidateId && (added as any).candidateId.toString() !== candidateId.toString()) {
        (async () => {
          try {
            const company = (added as any).companyId
              ? await AccountCompany.findById((added as any).companyId, "slug").lean()
              : null;
            const reviewLink = (company as any)?.slug ? `/company/detail/${(company as any).slug}` : `/company/list`;
            const notif = await Notification.create({
              candidateId: (added as any).candidateId,
              type: "other" as const,
              title: "Someone found your review helpful!",
              message: `Your review "${(added as any).title}" was marked as helpful.`,
              link: reviewLink,
              read: false,
            });
            notifyCandidate((added as any).candidateId.toString(), notif);
          } catch { /* non-critical */ }
        })();
      }
      res.json({ code: "success", isHelpful: true, helpfulCount: (added as any).helpfulCount });
      return;
    }

    // Already voted — remove vote atomically
    const removed = await Review.findOneAndUpdate(
      { _id: reviewId, status: "approved", deleted: false, helpfulVotes: candidateId },
      { $pull: { helpfulVotes: candidateId }, $inc: { helpfulCount: -1 } },
      { new: true, select: "helpfulCount" }
    ).lean();

    if (!removed) {
      res.status(404).json({ code: "error", message: "Review not found" });
      return;
    }

    res.json({ code: "success", isHelpful: false, helpfulCount: (removed as any).helpfulCount });
  } catch (error) {
    console.error("Mark helpful error:", error);
    res.status(500).json({ code: "error", message: "Failed to update" });
  }
};

// Get my reviews
export const getMyReviews = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account._id;

    const reviews = await Review.find({ candidateId, deleted: false })
      .select("companyId overallRating ratings title content pros cons isAnonymous isEdited status createdAt helpfulCount")
      .sort({ createdAt: -1 })
      .lean();

    const companyIds = reviews.map((r: any) => r.companyId);
    const companies = await AccountCompany.find({ _id: { $in: companyIds } })
      .select("companyName logo slug")
      .lean();
    const companyMap = new Map(companies.map((c: any) => [c._id.toString(), c]));

    const reviewsWithCompany = reviews.map((review: any) => {
      const company = companyMap.get(review.companyId.toString());
      return {
        id: review._id,
        company: company
          ? {
              id: company._id,
              name: company.companyName,
              logo: company.logo,
              slug: company.slug
            }
          : null,
        overallRating: review.overallRating,
        ratings: review.ratings,
        title: review.title,
        content: review.content,
        pros: review.pros,
        cons: review.cons,
        isAnonymous: review.isAnonymous,
        isEdited: review.isEdited || false,
        status: review.status,
        helpfulCount: review.helpfulCount,
        createdAt: review.createdAt
      };
    });

    res.json({
      code: "success",
      reviews: reviewsWithCompany
    });
  } catch (error) {
    console.error("Get my reviews error:", error);
    res.status(500).json({ code: "error", message: "Failed to get reviews" });
  }
};

// Check if candidate can review a company
export const canReview = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account._id;
    const { companyId } = req.params;

    // Validate companyId format
    if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
      res.status(400).json({ code: "error", message: "Invalid company ID." });
      return;
    }

    const existingReview = await Review.findOne({ companyId, candidateId, deleted: false }).select("_id").lean();

    res.json({
      code: "success",
      canReview: !existingReview,
      hasReviewed: !!existingReview
    });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Failed to check" });
  }
};

// Update review (only owner can update)
export const updateReview = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account._id;
    const { reviewId } = req.params;
    const { overallRating, ratings, title, content, pros, cons } = req.body;

    if (!req.account.isVerified) {
      res.status(403).json({ code: "error", message: "Only verified UIT students and alumni can edit reviews." });
      return;
    }

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ code: "error", message: "Invalid review ID." });
      return;
    }

    const review = await Review.findOne({ _id: reviewId, deleted: false });
    if (!review) {
      res.status(404).json({ code: "error", message: "Review not found" });
      return;
    }

    if (review.candidateId.toString() !== candidateId.toString()) {
      res.status(403).json({ code: "error", message: "You can only edit your own reviews" });
      return;
    }

    if (review.status === "rejected") {
      res.status(403).json({ code: "error", message: "Rejected reviews cannot be edited" });
      return;
    }

    // Validation (same as create)
    if (!title || typeof title !== "string" || title.trim().length < 5) {
      res.status(400).json({ code: "error", message: "Review title must be at least 5 characters" });
      return;
    }
    if (title.trim().length > 100) {
      res.status(400).json({ code: "error", message: "Review title must be at most 100 characters" });
      return;
    }
    if (!content || typeof content !== "string" || content.trim().length < 20) {
      res.status(400).json({ code: "error", message: "Review content must be at least 20 characters" });
      return;
    }
    if (content.trim().length > 5000) {
      res.status(400).json({ code: "error", message: "Review content must not exceed 5000 characters" });
      return;
    }
    if (pros && typeof pros === "string" && pros.trim().length > 2000) {
      res.status(400).json({ code: "error", message: "Pros must not exceed 2000 characters" });
      return;
    }
    if (cons && typeof cons === "string" && cons.trim().length > 2000) {
      res.status(400).json({ code: "error", message: "Cons must not exceed 2000 characters" });
      return;
    }
    const ratingNum = Number(overallRating);
    if (!overallRating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      res.status(400).json({ code: "error", message: "Overall rating must be between 1 and 5" });
      return;
    }

    review.overallRating = Math.min(5, Math.max(1, parseInt(overallRating) || 3));
    review.ratings = {
      salary: ratings?.salary ? Math.min(5, Math.max(1, parseInt(ratings.salary))) : null,
      workLifeBalance: ratings?.workLifeBalance ? Math.min(5, Math.max(1, parseInt(ratings.workLifeBalance))) : null,
      career: ratings?.career ? Math.min(5, Math.max(1, parseInt(ratings.career))) : null,
      culture: ratings?.culture ? Math.min(5, Math.max(1, parseInt(ratings.culture))) : null,
      management: ratings?.management ? Math.min(5, Math.max(1, parseInt(ratings.management))) : null
    };
    review.title = title.trim();
    review.content = sanitizeRichText(content);
    review.pros = sanitizeRichText(pros);
    review.cons = sanitizeRichText(cons);
    review.status = "pending";
    review.isEdited = true;

    await review.save();

    // Invalidate company list/top companies cache (review hidden from stats while pending)
    await invalidateJobDiscoveryCaches();

    // Notify admins with reviews_manage permission (fire-and-forget)
    (async () => {
      try {
        const roles = await Role.find({ permissions: "reviews_manage" }).select("_id").lean();
        const roleIds = roles.map((r: any) => r._id);
        const admins = await AccountAdmin.find({
          status: "active",
          deleted: false,
          $or: [{ isSuperAdmin: true }, { role: { $in: roleIds } }],
        }).select("_id").lean();

        const candidateName = req.account.fullName || "A candidate";
        const notifDocs = admins.map((admin: any) => ({
          adminId: admin._id,
          type: "other" as const,
          title: "Edited Review Pending Approval",
          message: `${candidateName} edited their review "${title.trim()}" — pending re-approval.`,
          link: "/admin-manage/reviews?status=pending",
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

    res.json({
      code: "success",
      message: "Review updated successfully. It will be visible again after approval.",
      review: {
        id: review._id,
        title: review.title,
        overallRating: review.overallRating
      }
    });
  } catch (error) {
    console.error("Update review error:", error);
    res.status(500).json({ code: "error", message: "Failed to update review" });
  }
};

// Delete review (only owner can delete)
export const deleteReview = async (req: RequestAccount, res: Response) => {
  try {
    if (!req.account.isVerified) {
      res.status(403).json({ code: "error", message: "Only verified UIT students and alumni can manage reviews." });
      return;
    }
    const candidateId = req.account._id;
    const { reviewId } = req.params;

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ code: "error", message: "Invalid review ID." });
      return;
    }

    const review = await Review.findOne({ _id: reviewId, deleted: false }).select("candidateId").lean();
    if (!review) {
      res.status(404).json({ code: "error", message: "Review not found" });
      return;
    }

    if (review.candidateId.toString() !== candidateId.toString()) {
      res.status(403).json({ code: "error", message: "You can only delete your own reviews" });
      return;
    }

    await Review.updateOne({ _id: reviewId }, { deleted: true });
    await Report.updateMany({ targetType: "review", targetId: reviewId }, { status: "resolved" });

    // Invalidate company list/top companies cache (review stats changed)
    await invalidateJobDiscoveryCaches();

    res.json({
      code: "success",
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ code: "error", message: "Failed to delete review" });
  }
};

// Report a review (anyone: candidate, company, or guest)
export const reportReview = async (req: RequestAccount, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;

    const isGuest = !req.account || !req.accountType || req.accountType === "guest";

    if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
      res.status(400).json({ code: "error", message: "Invalid review ID." });
      return;
    }

    const review = await Review.findOne({ _id: reviewId, deleted: false }).select("_id title").lean();
    if (!review) {
      res.status(404).json({ code: "error", message: "Review not found." });
      return;
    }

    // Check for duplicate report
    if (isGuest) {
      const clientIp = req.headers["x-forwarded-for"]
        ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
        : req.ip || "unknown";
      const existing = await Report.findOne({
        targetType: "review",
        targetId: reviewId,
        reporterIp: clientIp,
      }).lean();
      if (existing) {
        res.status(409).json({ code: "error", message: "You have already reported this review." });
        return;
      }
      await Report.create({
        targetType: "review",
        targetId: reviewId,
        reporterId: null,
        reporterType: "guest",
        reporterIp: clientIp,
        reason: reason.trim(),
      });
    } else {
      const existing = await Report.findOne({
        targetType: "review",
        targetId: reviewId,
        reporterId: req.account._id,
      }).lean();
      if (existing) {
        res.status(409).json({ code: "error", message: "You have already reported this review." });
        return;
      }
      await Report.create({
        targetType: "review",
        targetId: reviewId,
        reporterId: req.account._id,
        reporterType: req.accountType as "candidate" | "company",
        reason: reason.trim(),
      });
    }

    // Notify admins with reviews_manage or reports_manage permission (fire-and-forget, no email)
    (async () => {
      try {
        const roles = await Role.find({
          $or: [
            { permissions: "reviews_manage" },
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
          title: "Review Reported",
          message: `A review "${(review as any).title}" has been reported for: ${reason.trim().slice(0, 80)}`,
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

    res.json({ code: "success", message: "Report submitted. Thank you for helping keep the community safe." });
  } catch (error) {
    console.error("Report review error:", error);
    res.status(500).json({ code: "error", message: "Failed to submit report." });
  }
};
