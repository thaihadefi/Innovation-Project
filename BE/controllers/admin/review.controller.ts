import { Response } from "express";
import Review from "../../models/review.model";
import Report from "../../models/report.model";
import ExperienceComment from "../../models/experience-comment.model";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import { RequestAdmin } from "../../interfaces/request.interface";

const PAGE_SIZE = 10;

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

    const reportsWithDetails = await Promise.all(reports.map(async (r: any) => {
      let reporterName: string;
      if (r.reporterType === "guest") {
        reporterName = "Guest";
      } else if (r.reporterType === "candidate") {
        reporterName = candidateNameMap.get(r.reporterId?.toString()) || "Unknown";
      } else {
        reporterName = companyNameMap.get(r.reporterId?.toString()) || "Unknown";
      }

      // Fetch target content
      let targetContent: string | null = null;
      let targetTitle: string | null = null;
      let targetDeleted = false;

      if (r.targetType === "review") {
        const review = await Review.findById(r.targetId).select("title content").lean();
        if (review) {
          targetTitle = (review as any).title || null;
          targetContent = (review as any).content || null;
        } else {
          targetDeleted = true;
        }
      } else if (r.targetType === "comment") {
        const comment = await ExperienceComment.findById(r.targetId).select("content deleted").lean();
        if (comment) {
          targetContent = (comment as any).content || null;
          targetDeleted = !!(comment as any).deleted;
        } else {
          targetDeleted = true;
        }
      }

      return {
        ...r,
        reporterName,
        targetContent,
        targetTitle,
        targetDeleted,
      };
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
