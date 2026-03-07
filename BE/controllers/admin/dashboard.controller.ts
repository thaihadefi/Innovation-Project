import { Response } from "express";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import { RequestAdmin } from "../../interfaces/request.interface";

export const stats = async (_req: RequestAdmin, res: Response) => {
  try {
    const [
      totalCandidates, activeCandidates, inactiveCandidates, unverifiedCandidates,
      totalCompanies, pendingCompanies, activeCompanies, inactiveCompanies,
      totalJobs, totalCVs,
    ] = await Promise.all([
      AccountCandidate.countDocuments({}),
      AccountCandidate.countDocuments({ status: "active" }),
      AccountCandidate.countDocuments({ status: "inactive" }),
      AccountCandidate.countDocuments({ isVerified: false }),
      AccountCompany.countDocuments({}),
      AccountCompany.countDocuments({ status: "initial" }),
      AccountCompany.countDocuments({ status: "active" }),
      AccountCompany.countDocuments({ status: "inactive" }),
      Job.countDocuments({}),
      CV.countDocuments({}),
    ]);

    res.json({
      code: "success",
      stats: {
        candidates: { total: totalCandidates, active: activeCandidates, inactive: inactiveCandidates, unverified: unverifiedCandidates },
        companies: { total: totalCompanies, pending: pendingCompanies, active: activeCompanies, inactive: inactiveCompanies },
        jobs: { total: totalJobs },
        cvs: { total: totalCVs },
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
