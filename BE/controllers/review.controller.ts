import { Response } from "express";
import { parsePage } from "../helpers/pagination.helper";
import { RequestAccount } from "../interfaces/request.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { unauthorized, serverError, forbidden } from "../helpers/response.helper";
import * as reviewService from "../services/review.service";

export const createReview = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res, "Candidate login required.");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const body = req.body as reviewService.CreateReviewBodyDTO;

    const result = await reviewService.createReviewService({
      companyId: String(body.companyId || ""),
      candidateId: candidate._id,
      isVerified: candidate.isVerified,
      isAnonymous: body.isAnonymous,
      overallRating: body.overallRating || 0,
      ratings: body.ratings,
      title: String(body.title || ""),
      content: String(body.content || ""),
      pros: body.pros,
      cons: body.cons
    });

    res.status(result.status).json({
      code: result.code,
      message: result.message,
      review: result.review
    });
  } catch (error) {
    console.error("Create review error:", error);
    serverError(res, "Failed to submit review");
  }
};

export const getCompanyReviews = async (req: RequestAccount<{ companyId: string }>, res: Response): Promise<void> => {
  try {
    const companyId = String(req.params.companyId);
    const page = parsePage(req.query.page);

    const result = await reviewService.getCompanyReviewsService(companyId, page);
    if (result.error) {
      res.status(result.status || 400).json({ code: "error", message: result.error });
      return;
    }

    res.json({
      code: "success",
      reviews: result.reviews,
      stats: result.stats,
      pagination: result.pagination
    });
  } catch (error) {
    console.error("Get company reviews error:", error);
    serverError(res, "Failed to get reviews");
  }
};

export const markHelpful = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (req.accountType !== "candidate" || !req.account) {
      forbidden(res, "Only candidates can mark reviews as helpful");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const reviewId = String(req.params.reviewId || "");

    const result = await reviewService.markReviewHelpfulService(reviewId, candidate._id, candidate.isVerified);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Mark helpful error:", error);
    serverError(res, "Failed to update");
  }
};

export const getMyReviews = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res, "Candidate login required.");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const reviewsWithCompany = await reviewService.getCandidateReviewsService(candidate._id);

    res.json({
      code: "success",
      reviews: reviewsWithCompany
    });
  } catch (error) {
    console.error("Get my reviews error:", error);
    serverError(res, "Failed to get reviews");
  }
};

export const canReview = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res, "Candidate login required.");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const companyId = String(req.params.companyId || "");

    const result = await reviewService.checkCanReviewService(companyId, candidate._id);
    if (result.error) {
      res.status(result.status || 400).json({ code: "error", message: result.error });
      return;
    }

    res.json({
      code: "success",
      canReview: result.canReview,
      hasReviewed: result.hasReviewed
    });
  } catch {
    serverError(res, "Failed to check");
  }
};

export const updateReview = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res, "Candidate login required.");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const reviewId = String(req.params.reviewId || "");
    const body = req.body as reviewService.EditReviewBodyDTO;

    const result = await reviewService.updateReviewService(
      reviewId,
      candidate._id,
      candidate.fullName || "A candidate",
      candidate.isVerified,
      body
    );

    res.status(result.status).json(result);
  } catch (error) {
    console.error("Update review error:", error);
    serverError(res, "Failed to update review");
  }
};

export const deleteReview = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res, "Candidate login required.");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const reviewId = String(req.params.reviewId || "");

    const result = await reviewService.deleteReviewService(reviewId, candidate._id, candidate.isVerified);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Delete review error:", error);
    serverError(res, "Failed to delete review");
  }
};

export const reportReview = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    const reviewId = String(req.params.reviewId || "");
    const body = req.body as reviewService.ReportReviewBodyDTO;
    const reason = String(body.reason || "").trim();

    const isGuest = !req.account || !req.accountType || req.accountType === "guest";
    const clientIp = req.headers["x-forwarded-for"]
      ? String(req.headers["x-forwarded-for"]).split(",")[0].trim()
      : req.ip || "unknown";

    const reporterId = isGuest ? null : req.account!._id;
    const reporterType = isGuest ? "guest" : (req.accountType as "candidate" | "company");

    const result = await reviewService.reportReviewService(
      reviewId,
      reason,
      reporterId,
      reporterType,
      isGuest ? clientIp : null
    );

    res.status(result.status).json(result);
  } catch (error) {
    console.error("Report review error:", error);
    serverError(res, "Failed to submit report.");
  }
};
