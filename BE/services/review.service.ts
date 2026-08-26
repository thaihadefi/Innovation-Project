import mongoose, { FilterQuery, Types } from "mongoose";
import Review from "../models/review.model";
import AccountCompany from "../models/account-company.model";
import AccountCandidate from "../models/account-candidate.model";
import Notification from "../models/notification.model";
import Report from "../models/report.model";
import { sanitizeRichText } from "../helpers/sanitize-rich-text.helper";
import { notifyCandidate } from "../helpers/socket.helper";
import { invalidateJobDiscoveryCaches } from "../helpers/cache-invalidation.helper";
import { getBannedCandidateIds } from "../helpers/banned-candidates.helper";
import { paginationConfig } from "../config/variable";
import { buildPagination, PaginationDTO } from "../helpers/pagination.helper";
import { notifyAdminsWithPermissions } from "../helpers/admin-notification.helper";
import { IReview, IReviewRatings } from "../interfaces/models/review.interface";
import { IAccountCompany } from "../interfaces/models/account-company.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";

export interface CreateReviewBodyDTO {
  companyId?: string;
  isAnonymous?: boolean;
  overallRating?: number | string;
  ratings?: IReviewRatings;
  title?: string;
  content?: string;
  pros?: string;
  cons?: string;
}

export interface EditReviewBodyDTO {
  isAnonymous?: boolean;
  overallRating?: number | string;
  ratings?: IReviewRatings;
  title?: string;
  content?: string;
  pros?: string;
  cons?: string;
}

export interface ReportReviewBodyDTO {
  reason?: string;
}

export interface CreateReviewDTO {
  companyId: string;
  candidateId: Types.ObjectId;
  isVerified: boolean;
  isAnonymous?: boolean;
  overallRating: number | string;
  ratings?: IReviewRatings;
  title: string;
  content: string;
  pros?: string;
  cons?: string;
}

export interface ReviewAuthorDTO {
  id: Types.ObjectId;
  candidateId: string;
  overallRating: number;
  ratings?: IReviewRatings;
  title: string;
  content: string;
  pros?: string;
  cons?: string;
  authorName: string;
  authorAvatar: string | null;
  isAnonymous: boolean;
  helpfulCount: number;
  isEdited: boolean;
  createdAt: Date;
}

export interface ReviewStatsAggDTO {
  totalReviews: number;
  avgOverall: number;
  avgSalary: number | null;
  avgWorkLifeBalance: number | null;
  avgCareer: number | null;
  avgCulture: number | null;
  avgManagement: number | null;
}

export const createReviewService = async (
  input: CreateReviewDTO
): Promise<{ status: number; code: string; message: string; review?: { id: Types.ObjectId; title: string; overallRating: number } }> => {
  const { companyId, candidateId, isVerified, isAnonymous, overallRating, ratings, title, content, pros, cons } = input;

  if (!isVerified) {
    return { status: 403, code: "error", message: "Only verified UIT students and alumni can write reviews." };
  }

  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    return { status: 400, code: "error", message: "Invalid company ID." };
  }

  const company = await AccountCompany.findById(companyId).select("_id status").lean<IAccountCompany>();
  if (!company) {
    return { status: 404, code: "error", message: "Company not found" };
  }
  if (company.status !== "active") {
    return { status: 400, code: "error", message: "Cannot review this company." };
  }

  if (!title || typeof title !== "string" || !title.trim()) {
    return { status: 400, code: "error", message: "Title is required" };
  }
  if (title.trim().length > 200) {
    return { status: 400, code: "error", message: "Title must not exceed 200 characters" };
  }
  if (!content || typeof content !== "string" || !content.trim()) {
    return { status: 400, code: "error", message: "Review content is required" };
  }
  if (content.trim().length > 5000) {
    return { status: 400, code: "error", message: "Review content must not exceed 5000 characters" };
  }
  if (pros && typeof pros === "string" && pros.trim().length > 2000) {
    return { status: 400, code: "error", message: "Pros must not exceed 2000 characters" };
  }
  if (cons && typeof cons === "string" && cons.trim().length > 2000) {
    return { status: 400, code: "error", message: "Cons must not exceed 2000 characters" };
  }
  const ratingNum = Number(overallRating);
  if (!overallRating || isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return { status: 400, code: "error", message: "Overall rating must be between 1 and 5" };
  }

  const existingReview = await Review.findOne({
    companyId: new Types.ObjectId(companyId),
    candidateId,
    deleted: false
  })
    .select("_id")
    .lean();
  if (existingReview) {
    return { status: 409, code: "error", message: "You have already reviewed this company" };
  }

  const review = new Review({
    companyId: new Types.ObjectId(companyId),
    candidateId,
    isAnonymous: isAnonymous !== false,
    overallRating: Math.min(5, Math.max(1, parseInt(String(overallRating)) || 3)),
    ratings: {
      salary: ratings?.salary ? Math.min(5, Math.max(1, parseInt(String(ratings.salary)))) : null,
      workLifeBalance: ratings?.workLifeBalance ? Math.min(5, Math.max(1, parseInt(String(ratings.workLifeBalance)))) : null,
      career: ratings?.career ? Math.min(5, Math.max(1, parseInt(String(ratings.career)))) : null,
      culture: ratings?.culture ? Math.min(5, Math.max(1, parseInt(String(ratings.culture)))) : null,
      management: ratings?.management ? Math.min(5, Math.max(1, parseInt(String(ratings.management)))) : null
    },
    title: title.trim(),
    content: sanitizeRichText(content),
    pros: sanitizeRichText(pros || ""),
    cons: sanitizeRichText(cons || "")
  });

  await review.save();
  await invalidateJobDiscoveryCaches();

  return {
    status: 200,
    code: "success",
    message: "Review submitted successfully.",
    review: {
      id: review._id,
      title: review.title,
      overallRating: review.overallRating
    }
  };
};

export const getCompanyReviewsService = async (
  companyId: string,
  page: number
): Promise<{
  error?: string;
  status?: number;
  reviews?: ReviewAuthorDTO[];
  stats?: ReviewStatsAggDTO | null;
  pagination?: PaginationDTO;
}> => {
  if (!mongoose.Types.ObjectId.isValid(companyId)) {
    return { error: "Invalid company ID", status: 400 };
  }

  const limit = paginationConfig.companyReviews;
  const skip = (page - 1) * limit;

  const bannedIds = await getBannedCandidateIds();
  const reviewFilter: FilterQuery<IReview> = {
    companyId: new Types.ObjectId(companyId),
    status: "approved",
    deleted: false
  };
  if (bannedIds.length > 0) {
    reviewFilter.candidateId = { $nin: bannedIds.map(id => new Types.ObjectId(id)) };
  }

  const reviews = await Review.find(reviewFilter)
    .select("candidateId isAnonymous overallRating ratings title content pros cons helpfulCount isEdited createdAt")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean<IReview[]>();

  const nonAnonReviews = reviews.filter(r => !r.isAnonymous);
  const candidateIds = nonAnonReviews.map(r => r.candidateId);
  const candidates = await AccountCandidate.find({ _id: { $in: candidateIds } })
    .select("fullName avatar")
    .lean<IAccountCandidate[]>();
  const candidateMap = new Map(candidates.map(c => [c._id.toString(), c]));

  const reviewsWithAuthor: ReviewAuthorDTO[] = reviews.map(review => {
    let authorName = "Anonymous";
    let authorAvatar: string | null = null;

    if (!review.isAnonymous) {
      const candidate = candidateMap.get(review.candidateId.toString());
      if (candidate) {
        authorName = candidate.fullName || "User";
        authorAvatar = candidate.avatar || null;
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

  const stats = await Review.aggregate<ReviewStatsAggDTO>([
    { $match: reviewFilter },
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

  return {
    reviews: reviewsWithAuthor,
    stats: stats[0]
      ? {
          totalReviews: stats[0].totalReviews,
          avgOverall: Math.round(stats[0].avgOverall * 10) / 10,
          avgSalary: stats[0].avgSalary ? Math.round(stats[0].avgSalary * 10) / 10 : null,
          avgWorkLifeBalance: stats[0].avgWorkLifeBalance ? Math.round(stats[0].avgWorkLifeBalance * 10) / 10 : null,
          avgCareer: stats[0].avgCareer ? Math.round(stats[0].avgCareer * 10) / 10 : null,
          avgCulture: stats[0].avgCulture ? Math.round(stats[0].avgCulture * 10) / 10 : null,
          avgManagement: stats[0].avgManagement ? Math.round(stats[0].avgManagement * 10) / 10 : null
        }
      : null,
    pagination: buildPagination(totalReviews, page, limit),
  };
};

export const markReviewHelpfulService = async (
  reviewId: string,
  candidateId: Types.ObjectId,
  isVerified: boolean
): Promise<{ status: number; code: string; message?: string; isHelpful?: boolean; helpfulCount?: number }> => {
  if (!isVerified) {
    return { status: 403, code: "error", message: "Only verified UIT students and alumni can manage reviews." };
  }

  if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
    return { status: 400, code: "error", message: "Invalid review ID." };
  }

  const review = await Review.findOne({ _id: reviewId, status: "approved", deleted: false })
    .select("candidateId")
    .lean<Pick<IReview, "candidateId">>();

  if (!review) {
    return { status: 404, code: "error", message: "Review not found." };
  }

  if (review.candidateId?.toString() === candidateId.toString()) {
    return { status: 400, code: "error", message: "Cannot mark your own review as helpful." };
  }

  const added = await Review.findOneAndUpdate(
    { _id: reviewId, status: "approved", deleted: false, candidateId: { $ne: candidateId }, helpfulVotes: { $ne: candidateId } },
    { $addToSet: { helpfulVotes: candidateId }, $inc: { helpfulCount: 1 } },
    { new: true, select: "helpfulCount candidateId title companyId" }
  ).lean<IReview>();

  if (added) {
    if (added.candidateId && added.candidateId.toString() !== candidateId.toString()) {
      (async () => {
        try {
          const company = added.companyId
            ? await AccountCompany.findById(added.companyId, "slug").lean<IAccountCompany>()
            : null;
          const reviewLink = company?.slug ? `/company/detail/${company.slug}` : `/company/list`;
          const notif = await Notification.create({
            candidateId: added.candidateId,
            type: "other" as const,
            title: "Someone found your review helpful!",
            message: `Your review "${added.title}" received a helpful vote.`,
            link: reviewLink,
            read: false,
          });
          notifyCandidate(added.candidateId.toString(), notif);
        } catch {
        }
      })();
    }
    return { status: 200, code: "success", isHelpful: true, helpfulCount: added.helpfulCount };
  }

  const removed = await Review.findOneAndUpdate(
    { _id: reviewId, status: "approved", deleted: false, helpfulVotes: candidateId },
    { $pull: { helpfulVotes: candidateId }, $inc: { helpfulCount: -1 } },
    { new: true, select: "helpfulCount" }
  ).lean<IReview>();

  if (!removed) {
    return { status: 404, code: "error", message: "Review not found." };
  }

  return { status: 200, code: "success", isHelpful: false, helpfulCount: removed.helpfulCount };
};

export const getCandidateReviewsService = async (
  candidateId: Types.ObjectId
): Promise<unknown[]> => {
  const reviews = await Review.find({ candidateId, deleted: false })
    .sort({ createdAt: -1 })
    .lean<IReview[]>();

  const companyIds = reviews.map(r => r.companyId);
  const companies = await AccountCompany.find({ _id: { $in: companyIds } })
    .select("companyName slug logo")
    .lean<IAccountCompany[]>();
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

  return reviews.map(review => ({
    id: review._id,
    company: companyMap.get(review.companyId.toString()) || null,
    overallRating: review.overallRating,
    ratings: review.ratings,
    title: review.title,
    content: review.content,
    pros: review.pros,
    cons: review.cons,
    isAnonymous: review.isAnonymous,
    status: review.status,
    helpfulCount: review.helpfulCount || 0,
    isEdited: review.isEdited || false,
    createdAt: review.createdAt,
  }));
};

export const checkCanReviewService = async (
  companyId: string,
  candidateId: Types.ObjectId
): Promise<{ error?: string; status?: number; canReview?: boolean; hasReviewed?: boolean }> => {
  if (!companyId || !mongoose.Types.ObjectId.isValid(companyId)) {
    return { error: "Invalid company ID", status: 400 };
  }

  const company = await AccountCompany.findById(companyId).select("_id status").lean<IAccountCompany>();
  if (!company || company.status !== "active") {
    return { canReview: false, hasReviewed: false };
  }

  const existingReview = await Review.findOne({
    companyId: new Types.ObjectId(companyId),
    candidateId,
    deleted: false
  }).select("_id").lean();

  return {
    canReview: !existingReview,
    hasReviewed: !!existingReview
  };
};

export const updateReviewService = async (
  reviewId: string,
  candidateId: Types.ObjectId,
  candidateName: string,
  isVerified: boolean,
  input: {
    overallRating?: number | string;
    ratings?: IReviewRatings;
    title?: string;
    content?: string;
    pros?: string;
    cons?: string;
  }
): Promise<{ status: number; code: string; message: string; review?: { id: Types.ObjectId; title: string; overallRating: number } }> => {
  if (!isVerified) {
    return { status: 403, code: "error", message: "Only verified UIT students and alumni can manage reviews." };
  }

  if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
    return { status: 400, code: "error", message: "Invalid review ID." };
  }

  const review = await Review.findOne({ _id: reviewId, deleted: false });
  if (!review) {
    return { status: 404, code: "error", message: "Review not found" };
  }

  if (review.candidateId.toString() !== candidateId.toString()) {
    return { status: 403, code: "error", message: "You can only edit your own reviews" };
  }

  const { overallRating, ratings, title, content, pros, cons } = input;

  if (title !== undefined) {
    if (!title.trim()) return { status: 400, code: "error", message: "Title is required" };
    if (title.trim().length > 200) return { status: 400, code: "error", message: "Title must not exceed 200 characters" };
    review.title = title.trim();
  }

  if (content !== undefined) {
    if (!content.trim()) return { status: 400, code: "error", message: "Review content is required" };
    if (content.trim().length > 5000) return { status: 400, code: "error", message: "Review content must not exceed 5000 characters" };
    review.content = sanitizeRichText(content);
  }

  if (pros !== undefined) {
    if (pros.trim().length > 2000) return { status: 400, code: "error", message: "Pros must not exceed 2000 characters" };
    review.pros = sanitizeRichText(pros);
  }

  if (cons !== undefined) {
    if (cons.trim().length > 2000) return { status: 400, code: "error", message: "Cons must not exceed 2000 characters" };
    review.cons = sanitizeRichText(cons);
  }

  if (overallRating !== undefined) {
    const ratingNum = Number(overallRating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return { status: 400, code: "error", message: "Overall rating must be between 1 and 5" };
    }
    review.overallRating = Math.min(5, Math.max(1, parseInt(String(overallRating)) || 3));
  }

  if (ratings !== undefined) {
    review.ratings = {
      salary: ratings?.salary ? Math.min(5, Math.max(1, parseInt(String(ratings.salary)))) : null,
      workLifeBalance: ratings?.workLifeBalance ? Math.min(5, Math.max(1, parseInt(String(ratings.workLifeBalance)))) : null,
      career: ratings?.career ? Math.min(5, Math.max(1, parseInt(String(ratings.career)))) : null,
      culture: ratings?.culture ? Math.min(5, Math.max(1, parseInt(String(ratings.culture)))) : null,
      management: ratings?.management ? Math.min(5, Math.max(1, parseInt(String(ratings.management)))) : null
    };
  }

  review.status = "pending";
  review.isEdited = true;

  await review.save();
  await invalidateJobDiscoveryCaches();

  notifyAdminsWithPermissions(["reviews_manage"], {
    title: "Edited Review Pending Approval",
    message: `${candidateName} edited their review "${review.title}" — pending re-approval.`,
    link: "/admin-manage/reviews?status=pending",
  });

  return {
    status: 200,
    code: "success",
    message: "Review updated successfully. It will be visible again after approval.",
    review: {
      id: review._id,
      title: review.title,
      overallRating: review.overallRating
    }
  };
};

export const deleteReviewService = async (
  reviewId: string,
  candidateId: Types.ObjectId,
  isVerified: boolean
): Promise<{ status: number; code: string; message: string }> => {
  if (!isVerified) {
    return { status: 403, code: "error", message: "Only verified UIT students and alumni can manage reviews." };
  }

  if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
    return { status: 400, code: "error", message: "Invalid review ID." };
  }

  const review = await Review.findOne({ _id: reviewId, deleted: false }).select("candidateId").lean<IReview>();
  if (!review) {
    return { status: 404, code: "error", message: "Review not found" };
  }

  if (review.candidateId.toString() !== candidateId.toString()) {
    return { status: 403, code: "error", message: "You can only delete your own reviews" };
  }

  await Review.updateOne({ _id: reviewId }, { deleted: true });
  await Report.updateMany({ targetType: "review", targetId: new Types.ObjectId(reviewId) }, { status: "resolved" });
  await invalidateJobDiscoveryCaches();

  return {
    status: 200,
    code: "success",
    message: "Review deleted successfully"
  };
};

export const reportReviewService = async (
  reviewId: string,
  reason: string,
  reporterId: Types.ObjectId | null,
  reporterType: "candidate" | "company" | "guest",
  reporterIp: string | null
): Promise<{ status: number; code: string; message: string }> => {
  if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
    return { status: 400, code: "error", message: "Invalid review ID." };
  }

  const review = await Review.findOne({ _id: reviewId, deleted: false }).select("_id title").lean<IReview>();
  if (!review) {
    return { status: 404, code: "error", message: "Review not found." };
  }

  const reportFilter: FilterQuery<Report> = {
    targetType: "review",
    targetId: new Types.ObjectId(reviewId),
    ...(reporterType === "guest" ? { reporterIp } : { reporterId }),
  };

  const existing = await Report.findOne(reportFilter).lean();
  if (existing) {
    return { status: 409, code: "error", message: "You have already reported this review." };
  }

  await Report.create({
    targetType: "review",
    targetId: new Types.ObjectId(reviewId),
    reporterId: reporterType === "guest" ? null : reporterId,
    reporterType,
    reporterIp: reporterType === "guest" ? reporterIp : undefined,
    reason: reason.trim(),
  });

  notifyAdminsWithPermissions(["reviews_manage", "reports_manage"], {
    title: "Review Reported",
    message: `A review "${review.title}" has been reported for: ${reason.trim().slice(0, 80)}`,
    link: "/admin-manage/reports",
  });

  return { status: 200, code: "success", message: "Report submitted. Thank you for helping keep the community safe." };
};
