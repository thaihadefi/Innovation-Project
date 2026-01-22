/**
 * Company Badges System
 * Calculates and returns badges for companies based on their performance metrics
 */

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

// Badge Definitions - Commercial Grade Thresholds
// icon field uses semantic ID that FE maps to React Icons (no emoji - UI/UX Pro Max)
const BADGES = {
  TOP_RATED: {
    id: "top-rated",
    name: "Top Rated",
    icon: "star",
    description: "Average rating ≥ 4.5 stars with 3+ reviews",
  },
  ACTIVE_HIRER: {
    id: "active-hirer",
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

/**
 * Calculate badges for a company
 */
export function calculateCompanyBadges(metrics: {
  avgRating?: number;
  reviewCount?: number;
  totalApproved?: number;
  activeJobCount?: number;
}): BadgeResult {
  const badges: CompanyBadge[] = [];
  const { avgRating = 0, reviewCount = 0, totalApproved = 0, activeJobCount = 0 } = metrics;

  // Top Rated: avgRating >= 4.5 with 3+ reviews
  if (avgRating >= 4.5 && reviewCount >= 3) {
    badges.push(BADGES.TOP_RATED);
  }

  // Active Recruiter: 10+ approved candidates
  if (totalApproved >= 10) {
    badges.push(BADGES.ACTIVE_HIRER);
  }

  // Trusted Employer: 15+ reviews
  if (reviewCount >= 15) {
    badges.push(BADGES.TRUSTED_EMPLOYER);
  }

  // Hot Jobs: 5+ active positions
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

/**
 * Get all available badge definitions (for documentation)
 */
export function getAllBadgeDefinitions(): CompanyBadge[] {
  return Object.values(BADGES);
}

/**
 * Get approved counts by company IDs (batch query)
 * Reusable helper to avoid duplicated aggregation queries
 */
export async function getApprovedCountsByCompany(
  companyIds: any[],
  CV: any
): Promise<Map<string, number>> {
  if (companyIds.length === 0) {
    return new Map();
  }

  const approvedStats = await CV.aggregate([
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

  return new Map(approvedStats.map((s: any) => [s._id.toString(), s.totalApproved]));
}
