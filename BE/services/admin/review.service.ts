import { FilterQuery, Types } from "mongoose";
import Review from "../../models/review.model";
import Report from "../../models/report.model";
import ExperienceComment from "../../models/experience-comment.model";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import Notification from "../../models/notification.model";
import { notifyCandidate } from "../../helpers/socket.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { adminPaginationConfig } from "../../config/variable";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";
import { AUDIT_ACTIONS } from "../../config/audit-actions";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { buildRegexFilter } from "../../helpers/query.helper";
import { IReview } from "../../interfaces/models/review.interface";
import { IReport } from "../../interfaces/models/report.interface";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import { IExperienceComment } from "../../interfaces/models/experience-comment.interface";

export const getAdminReviewListService = async (
  page: number,
  keyword?: string,
  status?: string
): Promise<{
  code: string;
  reviews: unknown[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.reports;
  const skip = (page - 1) * pageSize;

  const filter: FilterQuery<IReview> = {};
  if (status && ["pending", "approved", "rejected"].includes(status)) filter.status = status;
  if (keyword) {
    const regexFilter = buildRegexFilter(["title", "content"], keyword);
    if (regexFilter.$or) {
      filter.$or = regexFilter.$or as FilterQuery<IReview>["$or"];
    }
  }

  const [total, reviews] = await Promise.all([
    Review.countDocuments(filter),
    Review.find(filter)
      .select("companyId candidateId isAnonymous overallRating title content pros cons status isEdited createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<IReview[]>(),
  ]);

  const companyIds = [...new Set(reviews.map(r => r.companyId.toString()))];
  const candidateIds = [...new Set(reviews.map(r => r.candidateId.toString()))];
  const [companies, candidates] = await Promise.all([
    AccountCompany.find({ _id: { $in: companyIds } }).select("companyName").lean<Pick<IAccountCompany, "_id" | "companyName">[]>(),
    AccountCandidate.find({ _id: { $in: candidateIds } }).select("fullName").lean<Pick<IAccountCandidate, "_id" | "fullName">[]>(),
  ]);
  const companyMap = new Map(companies.map(c => [c._id.toString(), c.companyName]));
  const candidateMap = new Map(candidates.map(c => [c._id.toString(), c.fullName]));

  const reviewsWithDetails = reviews.map(r => ({
    ...r,
    companyName: companyMap.get(r.companyId.toString()) || "Unknown",
    candidateName: r.isAnonymous ? "Anonymous" : (candidateMap.get(r.candidateId.toString()) || "Unknown"),
  }));

  return {
    code: "success",
    reviews: reviewsWithDetails,
    pagination: buildPagination(total, page, pageSize),
  };
};

export const updateAdminReviewStatusService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string,
  status: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!["approved", "rejected"].includes(status)) {
    return { status: 400, code: "error", message: "Invalid status. Must be 'approved' or 'rejected'." };
  }

  const review = await Review.findByIdAndUpdate(id, { status }, { new: false }).select("candidateId title status companyId").lean<IReview>();
  if (!review) {
    return { status: 404, code: "error", message: "Review not found." };
  }

  if (review.status === status) {
    await invalidateJobDiscoveryCaches();
    return { status: 200, code: "success", message: status === "approved" ? "Review approved." : "Review rejected." };
  }

  if (review.candidateId) {
    const company = review.companyId
      ? await AccountCompany.findById(review.companyId, "slug").lean<Pick<IAccountCompany, "slug">>()
      : null;
    const reviewLink = company?.slug ? `/company/detail/${company.slug}` : "/company/list";
    const notif = await Notification.create({
      candidateId: review.candidateId,
      type: "other" as const,
      title: status === "approved" ? "Review Approved!" : "Review Not Approved",
      message: status === "approved"
        ? `Your review "${review.title}" has been approved and is now visible.`
        : `Your review "${review.title}" was not approved.`,
      link: reviewLink,
      read: false,
    });
    notifyCandidate(review.candidateId.toString(), notif);
  }

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: status === "approved" ? AUDIT_ACTIONS.REVIEW_APPROVE : AUDIT_ACTIONS.REVIEW_REJECT,
    targetId: id,
    targetType: "Review",
    detail: { title: review.title },
  });
  await invalidateJobDiscoveryCaches();

  return { status: 200, code: "success", message: status === "approved" ? "Review approved." : "Review rejected." };
};

export const deleteAdminReviewService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string
): Promise<{ status: number; code: string; message: string }> => {
  const review = await Review.findOneAndUpdate({ _id: id, deleted: false }, { deleted: true }).select("title companyId").lean<IReview>();
  if (!review) {
    return { status: 404, code: "error", message: "Review not found." };
  }

  await Report.updateMany({ targetType: "review", targetId: id }, { status: "resolved" });
  await invalidateJobDiscoveryCaches();

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.REVIEW_DELETE,
    targetId: id,
    targetType: "Review",
    detail: { title: review.title, companyId: review.companyId?.toString() || null },
  });

  return { status: 200, code: "success", message: "Review deleted." };
};

export const getAdminReportListService = async (
  page: number,
  keyword?: string,
  status?: string,
  targetType?: string
): Promise<{
  code: string;
  reports: unknown[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.reports;
  const skip = (page - 1) * pageSize;

  const filter: FilterQuery<IReport> = {};
  if (status && ["pending", "resolved", "dismissed"].includes(status)) filter.status = status;
  if (targetType && ["review", "comment"].includes(targetType)) filter.targetType = targetType;

  if (keyword) {
    const [matchedCandidates, matchedCompanies, matchedReviews, matchedComments] = await Promise.all([
      AccountCandidate.find({ fullName: { $regex: keyword, $options: "i" } }).select("_id").lean<Pick<IAccountCandidate, "_id">[]>(),
      AccountCompany.find({ companyName: { $regex: keyword, $options: "i" } }).select("_id").lean<Pick<IAccountCompany, "_id">[]>(),
      Review.find({ $or: [{ title: { $regex: keyword, $options: "i" } }, { content: { $regex: keyword, $options: "i" } }] }).select("_id").lean<Pick<IReview, "_id">[]>(),
      ExperienceComment.find({ content: { $regex: keyword, $options: "i" } }).select("_id").lean<Pick<IExperienceComment, "_id">[]>(),
    ]);

    const reporterIds = [
      ...matchedCandidates.map(c => c._id),
      ...matchedCompanies.map(c => c._id),
    ];
    const targetIds = [
      ...matchedReviews.map(r => r._id),
      ...matchedComments.map(c => c._id),
    ];

    const orConditions: Array<Record<string, unknown>> = [
      { reason: { $regex: keyword, $options: "i" } },
    ];
    if (reporterIds.length > 0) orConditions.push({ reporterId: { $in: reporterIds } });
    if (targetIds.length > 0) orConditions.push({ targetId: { $in: targetIds } });

    filter.$or = orConditions;
  }

  const [total, reports] = await Promise.all([
    Report.countDocuments(filter),
    Report.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<IReport[]>(),
  ]);

  const candidateReporterIds = reports.filter(r => r.reporterType === "candidate").map(r => r.reporterId);
  const companyReporterIds = reports.filter(r => r.reporterType === "company").map(r => r.reporterId);

  const [reporterCandidates, reporterCompanies] = await Promise.all([
    AccountCandidate.find({ _id: { $in: candidateReporterIds } }).select("fullName").lean<Pick<IAccountCandidate, "_id" | "fullName">[]>(),
    AccountCompany.find({ _id: { $in: companyReporterIds } }).select("companyName").lean<Pick<IAccountCompany, "_id" | "companyName">[]>(),
  ]);
  const candidateNameMap = new Map(reporterCandidates.map(c => [c._id.toString(), c.fullName]));
  const companyNameMap = new Map(reporterCompanies.map(c => [c._id.toString(), c.companyName]));

  const reviewTargetIds = reports.filter(r => r.targetType === "review").map(r => r.targetId);
  const commentTargetIds = reports.filter(r => r.targetType === "comment").map(r => r.targetId);
  const [reviewTargets, commentTargets] = await Promise.all([
    reviewTargetIds.length > 0 ? Review.find({ _id: { $in: reviewTargetIds } }).select("title content").lean<IReview[]>() : [],
    commentTargetIds.length > 0 ? ExperienceComment.find({ _id: { $in: commentTargetIds } }).select("content deleted").lean<IExperienceComment[]>() : [],
  ]);
  const reviewTargetMap = new Map(reviewTargets.map(r => [r._id.toString(), r]));
  const commentTargetMap = new Map(commentTargets.map(c => [c._id.toString(), c]));

  const reportsWithDetails = reports.map(r => {
    let reporterName: string;
    if (r.reporterType === "guest") {
      reporterName = "Guest";
    } else if (r.reporterType === "candidate") {
      reporterName = candidateNameMap.get(r.reporterId?.toString() || "") || "Unknown";
    } else {
      reporterName = companyNameMap.get(r.reporterId?.toString() || "") || "Unknown";
    }

    let targetContent: string | null = null;
    let targetTitle: string | null = null;
    let targetDeleted = false;

    if (r.targetType === "review") {
      const review = reviewTargetMap.get(r.targetId?.toString() || "");
      if (review) {
        targetTitle = review.title || null;
        targetContent = review.content || null;
      } else {
        targetDeleted = true;
      }
    } else if (r.targetType === "comment") {
      const comment = commentTargetMap.get(r.targetId?.toString() || "");
      if (comment) {
        targetContent = comment.content || null;
        targetDeleted = !!comment.deleted;
      } else {
        targetDeleted = true;
      }
    }

    return { ...r, reporterName, targetContent, targetTitle, targetDeleted };
  });

  return {
    code: "success",
    reports: reportsWithDetails,
    pagination: buildPagination(total, page, pageSize),
  };
};

export const updateAdminReportStatusService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string,
  status: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!["resolved", "dismissed"].includes(status)) {
    return { status: 400, code: "error", message: "Invalid status." };
  }

  const report = await Report.findByIdAndUpdate(id, { status }, { new: true }).lean<IReport>();
  if (!report) {
    return { status: 404, code: "error", message: "Report not found." };
  }

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: status === "resolved" ? AUDIT_ACTIONS.REPORT_RESOLVE : AUDIT_ACTIONS.REPORT_DISMISS,
    targetId: id,
    targetType: "Report",
    detail: { targetType: report.targetType, reason: report.reason },
  });

  return { status: 200, code: "success", message: `Report ${status}.` };
};
