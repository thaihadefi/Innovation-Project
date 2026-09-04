import { Types } from "mongoose";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import { paginationConfig } from "../../config/variable";
import { buildPagination } from "../../helpers/pagination.helper";
import { IJob } from "../../interfaces/models/job.interface";

export const getCompanyAnalyticsService = async (
  companyId: Types.ObjectId,
  page: number,
  timeRangeInput?: string,
  sortByInput?: string
): Promise<unknown> => {
  const pageSize = paginationConfig.companyJobList || 6;
  const timeRange = (["7d", "30d", "90d", "all"] as const).includes(timeRangeInput as "7d" | "30d" | "90d" | "all") ? (timeRangeInput as "7d" | "30d" | "90d" | "all") : "30d";
  const sortBy = (["views", "applications", "approved"] as const).includes(sortByInput as "views" | "applications" | "approved") ? (sortByInput as "views" | "applications" | "approved") : "views";

  const jobs = await Job.find({ companyId })
    .select("_id title slug viewCount expirationDate createdAt")
    .sort({ createdAt: -1 })
    .lean<IJob[]>();
  const jobIds = jobs.map(j => j._id);

  interface CvCountGroup {
    _id: string;
    count: number;
  }
  const cvCounts = await CV.aggregate<CvCountGroup>([
    { $match: { jobId: { $in: jobIds } } },
    { $group: { _id: "$status", count: { $sum: 1 } } }
  ]);

  const statusCounts: Record<string, number> = {};
  cvCounts.forEach(c => {
    statusCounts[c._id] = c.count;
  });

  const totalInitial = statusCounts["initial"] || 0;
  const totalViewed = statusCounts["viewed"] || 0;
  const totalApproved = statusCounts["approved"] || 0;
  const totalRejected = statusCounts["rejected"] || 0;
  const totalApplications = totalInitial + totalViewed + totalApproved + totalRejected;

  let totalViews = 0;

  interface JobCvAggGroup {
    _id: Types.ObjectId;
    totalApplications: number;
    approvedCount: number;
  }
  const cvAggregation = await CV.aggregate<JobCvAggGroup>([
    { $match: { jobId: { $in: jobIds } } },
    {
      $group: {
        _id: "$jobId",
        totalApplications: { $sum: 1 },
        approvedCount: {
          $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
        }
      }
    }
  ]);

  const cvCountMap = new Map(cvAggregation.map(c => [c._id.toString(), c]));

  const jobsData = jobs.map(job => {
    const views = job.viewCount || 0;
    const jobIdStr = job._id.toString();

    const cvStats = cvCountMap.get(jobIdStr) || { totalApplications: 0, approvedCount: 0 };
    const actualApplications = cvStats.totalApplications;
    const actualApproved = cvStats.approvedCount;

    totalViews += views;

    const applyRate = views > 0 ? ((actualApplications / views) * 100).toFixed(1) : 0;
    const approvalRate = actualApplications > 0 ? ((actualApproved / actualApplications) * 100).toFixed(1) : 0;

    return {
      id: job._id.toString(),
      title: job.title,
      slug: job.slug,
      views,
      applications: actualApplications,
      approved: actualApproved,
      applyRate: parseFloat(String(applyRate)) || 0,
      approvalRate: parseFloat(String(approvalRate)) || 0,
      createdAt: job.createdAt,
      isExpired: job.expirationDate ? new Date(job.expirationDate) < new Date() : false
    };
  });

  const overallApplyRate = totalViews > 0
    ? parseFloat(((totalApplications / totalViews) * 100).toFixed(1))
    : 0;
  const overallApprovalRate = totalApplications > 0
    ? parseFloat(((totalApproved / totalApplications) * 100).toFixed(1))
    : 0;

  const rangeToMs: Record<string, number> = {
    "7d": 7 * 24 * 60 * 60 * 1000,
    "30d": 30 * 24 * 60 * 60 * 1000,
    "90d": 90 * 24 * 60 * 60 * 1000,
    "all": 0
  };
  const now = Date.now();
  const filteredJobs = jobsData.filter(job => {
    if (timeRange === "all") return true;
    const createdAt = new Date(job.createdAt).getTime();
    return now - createdAt <= rangeToMs[timeRange];
  });

  const topJobsLimit = 10;
  const chartJobs = filteredJobs
    .slice()
    .sort((a, b) => {
      const aMetric = Number(a[sortBy] || 0);
      const bMetric = Number(b[sortBy] || 0);
      if (bMetric !== aMetric) return bMetric - aMetric;
      return (a.title || "").localeCompare(b.title || "");
    })
    .slice(0, topJobsLimit)
    .map(job => ({
      fullName: job.title || "",
      name: (job.title || "").length > 20 ? (job.title || "").substring(0, 17) + "..." : (job.title || ""),
      views: job.views || 0,
      applications: job.applications || 0,
      approved: job.approved || 0
    }));

  const totalFiltered = filteredJobs.length;
  const totalPage = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(page, totalPage);
  const skip = (safePage - 1) * pageSize;
  const paginatedJobs = filteredJobs.slice(skip, skip + pageSize);

  return {
    code: "success",
    overview: {
      totalJobs: jobs.length,
      totalViews,
      totalApplications,
      totalApproved,
      totalViewed,
      totalRejected,
      totalPending: totalInitial,
      applyRate: overallApplyRate,
      approvalRate: overallApprovalRate
    },
    controls: {
      sortBy,
      timeRange
    },
    chartJobs,
    jobs: paginatedJobs,
    jobsPagination: buildPagination(totalFiltered, safePage, pageSize),
    hasAnyJobs: jobsData.length > 0
  };
};
