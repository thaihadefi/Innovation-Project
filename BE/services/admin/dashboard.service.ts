import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";

export interface AdminDashboardStatsDTO {
  candidates: {
    total: number;
    active: number;
    inactive: number;
    unverified: number;
  };
  companies: {
    total: number;
    pending: number;
    active: number;
    inactive: number;
  };
  jobs: {
    total: number;
  };
  cvs: {
    total: number;
  };
}

export const getDashboardStatsService = async (): Promise<{ code: string; stats: AdminDashboardStatsDTO }> => {
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

  return {
    code: "success",
    stats: {
      candidates: { total: totalCandidates, active: activeCandidates, inactive: inactiveCandidates, unverified: unverifiedCandidates },
      companies: { total: totalCompanies, pending: pendingCompanies, active: activeCompanies, inactive: inactiveCompanies },
      jobs: { total: totalJobs },
      cvs: { total: totalCVs },
    },
  };
};
