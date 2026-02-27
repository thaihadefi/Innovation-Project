import { Response } from "express";
import mongoose from "mongoose";
import { RequestAccount } from "../interfaces/request.interface";
import Review from "../models/review.model";
import AccountCompany from "../models/account-company.model";
import AccountCandidate from "../models/account-candidate.model";
import { paginationConfig } from "../config/variable";

// Create a review
export const createReview = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account._id;
    const { companyId, isAnonymous, overallRating, ratings, title, content, pros, cons } = req.body;

    const company = await AccountCompany.findById(companyId).select("_id").lean();
    if (!company) {
      res.status(404).json({ code: "error", message: "Company not found" });
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
    if (!overallRating || overallRating < 1 || overallRating > 5) {
      res.status(400).json({ code: "error", message: "Overall rating must be between 1 and 5" });
      return;
    }

    const existingReview = await Review.findOne({ companyId, candidateId }).select("_id").lean();
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
      title,
      content,
      pros: pros || "",
      cons: cons || ""
    });

    await review.save();

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

    const reviews = await Review.find({
      companyId,
      status: "approved"
    })
      .select("candidateId isAnonymous overallRating ratings title content pros cons helpfulCount createdAt")
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
        createdAt: review.createdAt
      };
    });

    const stats = await Review.aggregate([
      { $match: { companyId: new mongoose.Types.ObjectId(companyId), status: "approved" } },
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

    const candidateId = req.account._id;
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId).select("helpfulVotes helpfulCount");
    if (!review) {
      res.status(404).json({ code: "error", message: "Review not found" });
      return;
    }

    const hasVoted = review.helpfulVotes.includes(candidateId);

    if (hasVoted) {
      review.helpfulVotes = review.helpfulVotes.filter(
        (id: any) => id.toString() !== candidateId.toString()
      );
      review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1);
    } else {
      review.helpfulVotes.push(candidateId);
      review.helpfulCount = (review.helpfulCount || 0) + 1;
    }

    await review.save();

    res.json({
      code: "success",
      isHelpful: !hasVoted,
      helpfulCount: review.helpfulCount
    });
  } catch (error) {
    console.error("Mark helpful error:", error);
    res.status(500).json({ code: "error", message: "Failed to update" });
  }
};

// Get my reviews
export const getMyReviews = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account._id;

    const reviews = await Review.find({ candidateId })
      .select("companyId overallRating ratings title content pros cons status createdAt helpfulCount")
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
        title: review.title,
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

    const existingReview = await Review.findOne({ companyId, candidateId }).select("_id").lean();

    res.json({
      code: "success",
      canReview: !existingReview,
      hasReviewed: !!existingReview
    });
  } catch (error) {
    res.status(500).json({ code: "error", message: "Failed to check" });
  }
};

// Delete review (only owner can delete)
export const deleteReview = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account._id;
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId).select("candidateId").lean();
    if (!review) {
      res.status(404).json({ code: "error", message: "Review not found" });
      return;
    }

    if (review.candidateId.toString() !== candidateId.toString()) {
      res.status(403).json({ code: "error", message: "You can only delete your own reviews" });
      return;
    }

    await Review.deleteOne({ _id: reviewId });

    res.json({
      code: "success",
      message: "Review deleted successfully"
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({ code: "error", message: "Failed to delete review" });
  }
};
