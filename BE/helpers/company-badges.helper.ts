import { Model, Types } from "mongoose";
import { ICV } from "../interfaces/models/cv.interface";

export interface CompanyBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
}

export interface BadgeResult {
  badges: CompanyBadge[];
  stats: {
    avgRating: number;
    totalReviews: number;
    totalApproved: number;
    activeJobs: number;
  };
}

const BADGES = {
  TOP_RATED: {
    id: "top-rated",
    name: "Top Rated",
    icon: "star",
    description: "Average rating >= 4.5 stars with 3+ reviews",
  },
  ACTIVE_RECRUITER: {
    id: "active-recruiter",
    name: "Active Recruiter",
    icon: "briefcase",
    description: "Approved 10+ candidate applications",
  },
  TRUSTED_EMPLOYER: {
    id: "trusted-employer",
    name: "Trusted Employer",
    icon: "check-circle",
    description: "Received 15+ candidate reviews",
  },
  HOT_JOBS: {
    id: "hot-jobs",
    name: "Hot Jobs",
    icon: "fire",
    description: "Currently hiring for 5+ positions",
  },
};

export function calculateCompanyBadges(metrics: {
  avgRating?: number;
  reviewCount?: number;
  totalApproved?: number;
  activeJobCount?: number;
}): BadgeResult {
  const badges: CompanyBadge[] = [];
  const { avgRating = 0, reviewCount = 0, totalApproved = 0, activeJobCount = 0 } = metrics;

  if (avgRating >= 4.5 && reviewCount >= 3) {
    badges.push(BADGES.TOP_RATED);
  }

  if (totalApproved >= 10) {
    badges.push(BADGES.ACTIVE_RECRUITER);
  }

  if (reviewCount >= 15) {
    badges.push(BADGES.TRUSTED_EMPLOYER);
  }

  if (activeJobCount >= 5) {
    badges.push(BADGES.HOT_JOBS);
  }

  return {
    badges,
    stats: {
      avgRating,
      totalReviews: reviewCount,
      totalApproved,
      activeJobs: activeJobCount,
    },
  };
}

export function getAllBadgeDefinitions(): CompanyBadge[] {
  return Object.values(BADGES);
}

export async function getApprovedCountsByCompany(
  companyIds: Types.ObjectId[],
  cvModel: Model<ICV>
): Promise<Map<string, number>> {
  if (companyIds.length === 0) {
    return new Map();
  }

  interface ApprovedGroup {
    _id: Types.ObjectId;
    totalApproved: number;
  }

  const approvedStats = await cvModel.aggregate<ApprovedGroup>([
    {
      $lookup: {
        from: "jobs",
        localField: "jobId",
        foreignField: "_id",
        as: "job"
      }
    },
    { $unwind: "$job" },
    { $match: { "job.companyId": { $in: companyIds }, status: "approved" } },
    { $group: { _id: "$job.companyId", totalApproved: { $sum: 1 } } }
  ]);

  return new Map(approvedStats.map(s => [s._id.toString(), s.totalApproved]));
}
