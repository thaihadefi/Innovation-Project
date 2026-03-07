import { Response } from "express";
import Review from "../../models/review.model";
import Report from "../../models/report.model";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import { RequestAdmin } from "../../interfaces/request.interface";

const PAGE_SIZE = 10;

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const keyword = String(req.query.keyword || "").trim();
    const status = req.query.status as string | undefined;

    const filter: any = {};
    if (keyword) {
      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { content: { $regex: keyword, $options: "i" } },
      ];
    }
    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filter.status = status;
    }

    const skip = (page - 1) * PAGE_SIZE;
    const [total, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.find(filter)
        .select("companyId candidateId isAnonymous overallRating title status helpfulCount createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
        .lean(),
    ]);

    // Attach candidate/company names
    const candidateIds = [...new Set(reviews.map((r: any) => r.candidateId?.toString()).filter(Boolean))];
    const companyIds = [...new Set(reviews.map((r: any) => r.companyId?.toString()).filter(Boolean))];

    const [candidates, companies] = await Promise.all([
      AccountCandidate.find({ _id: { $in: candidateIds } }).select("fullName").lean(),
      AccountCompany.find({ _id: { $in: companyIds } }).select("companyName").lean(),
    ]);

    const candidateMap = new Map(candidates.map((c: any) => [c._id.toString(), c.fullName]));
    const companyMap = new Map(companies.map((c: any) => [c._id.toString(), c.companyName]));

    const reviewsWithDetails = reviews.map((r: any) => ({
      ...r,
      candidateName: r.isAnonymous ? "Anonymous" : (candidateMap.get(r.candidateId?.toString()) || "Unknown"),
      companyName: companyMap.get(r.companyId?.toString()) || "Unknown",
    }));

    res.json({
      code: "success",
      reviews: reviewsWithDetails,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        currentPage: page,
        pageSize: PAGE_SIZE,
      },
    });
  } catch (error) {
    console.error("Admin list reviews error:", error);
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
    const status = req.query.status as string | undefined;
    const targetType = req.query.targetType as string | undefined;

    const filter: any = {};
    if (status && ["pending", "resolved", "dismissed"].includes(status)) filter.status = status;
    if (targetType && ["review", "comment"].includes(targetType)) filter.targetType = targetType;

    const skip = (page - 1) * PAGE_SIZE;
    const [total, reports] = await Promise.all([
      Report.countDocuments(filter),
      Report.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(PAGE_SIZE)
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

    const reportsWithDetails = reports.map((r: any) => ({
      ...r,
      reporterName: r.reporterType === "candidate"
        ? (candidateNameMap.get(r.reporterId?.toString()) || "Unknown")
        : (companyNameMap.get(r.reporterId?.toString()) || "Unknown"),
    }));

    res.json({
      code: "success",
      reports: reportsWithDetails,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / PAGE_SIZE)),
        currentPage: page,
        pageSize: PAGE_SIZE,
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
