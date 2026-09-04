import mongoose, { Types } from "mongoose";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import Location from "../../models/location.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Notification from "../../models/notification.model";
import Review from "../../models/review.model";
import cache, { CACHE_TTL } from "../../helpers/cache.helper";
import { discoveryConfig, paginationConfig } from "../../config/variable";
import { calculateCompanyBadges, getApprovedCountsByCompany, CompanyBadge } from "../../helpers/company-badges.helper";
import { findIdsByKeyword } from "../../helpers/atlas-search.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import {
  findLocationByNormalizedSlug,
  normalizeLocationSlug,
} from "../../helpers/location.helper";
import { getBannedCandidateIds } from "../../helpers/banned-candidates.helper";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { IJob } from "../../interfaces/models/job.interface";
import { ILocation } from "../../interfaces/models/location.interface";

export interface TopCompanyItemDTO {
  id: Types.ObjectId;
  companyName: string;
  slug?: string;
  logo?: string;
  locationName: string;
  jobCount: number;
  avgRating: number | null;
  reviewCount: number;
  badges: CompanyBadge[];
}

export const getTopCompaniesService = async (): Promise<{ code: string; topCompanies: TopCompanyItemDTO[] }> => {
  const cacheKey = "top_companies";
  const cached = await cache.getAsync<{ code: string; topCompanies: TopCompanyItemDTO[] }>(cacheKey);
  if (cached) {
    return cached;
  }

  interface JobCountGroup {
    _id: Types.ObjectId | null;
    count: number;
  }

  const jobCountAgg = await Job.aggregate<JobCountGroup>([
    {
      $match: {
        $or: [
          { expirationDate: { $exists: false } },
          { expirationDate: null },
          { expirationDate: { $gte: new Date() } }
        ]
      }
    },
    { $group: { _id: "$companyId", count: { $sum: 1 } } }
  ]);

  const companyJobCount: Record<string, number> = {};
  jobCountAgg.forEach(r => {
    if (r._id) companyJobCount[r._id.toString()] = r.count;
  });

  const companyIds = Object.keys(companyJobCount);
  const companiesInfo = await AccountCompany.find({
    _id: { $in: companyIds.map(id => new Types.ObjectId(id)) }
  }).select("companyName slug logo location").lean<IAccountCompany[]>();

  const bannedIds = await getBannedCandidateIds();
  const reviewMatch: Record<string, unknown> = {
    companyId: { $in: companiesInfo.map(c => c._id) },
    status: "approved",
    deleted: false
  };
  if (bannedIds.length > 0) {
    reviewMatch.candidateId = { $nin: bannedIds.map(id => new mongoose.Types.ObjectId(id)) };
  }

  interface ReviewStatsGroup {
    _id: Types.ObjectId;
    avgRating: number;
    reviewCount: number;
  }

  const reviewStats = await Review.aggregate<ReviewStatsGroup>([
    { $match: reviewMatch },
    {
      $group: {
        _id: "$companyId",
        avgRating: { $avg: "$overallRating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  const reviewStatsMap = new Map(
    reviewStats.map(r => [r._id.toString(), { avgRating: r.avgRating, reviewCount: r.reviewCount }])
  );

  const locationIds = companiesInfo.map(c => c.location).filter(Boolean);
  const locations = await Location.find({ _id: { $in: locationIds } }).select("_id name").lean<Pick<ILocation, "_id" | "name">[]>();
  const locationMap = new Map(locations.map(c => [c._id.toString(), c.name]));

  const topCompanyIds = companiesInfo.map(c => c._id);
  const approvedMapTop = await getApprovedCountsByCompany(topCompanyIds, CV);

  const sortedCompanies = companiesInfo.map(company => {
    const stats = reviewStatsMap.get(company._id.toString());
    const totalApproved = approvedMapTop.get(company._id.toString()) || 0;
    const jobCount = companyJobCount[company._id.toString()] || 0;
    const badgeResult = calculateCompanyBadges({
      avgRating: stats?.avgRating,
      reviewCount: stats?.reviewCount || 0,
      totalApproved,
      activeJobCount: jobCount
    });
    return {
      id: company._id,
      companyName: company.companyName,
      slug: company.slug,
      logo: company.logo,
      locationName: company.location ? locationMap.get(company.location.toString()) || "" : "",
      jobCount,
      avgRating: stats?.avgRating ? Math.round(stats.avgRating * 10) / 10 : null,
      reviewCount: stats?.reviewCount || 0,
      badges: badgeResult.badges
    };
  })
    .sort((a, b) => b.jobCount - a.jobCount || (a.companyName || "").localeCompare(b.companyName || "", "vi"))
    .slice(0, discoveryConfig.topCompanies);

  const response = {
    code: "success",
    topCompanies: sortedCompanies
  };

  cache.set(cacheKey, response, CACHE_TTL.DYNAMIC);
  return response;
};

export const getPublicCompanyListService = async (
  query: { keyword?: string; location?: string; page?: number | string; limitItems?: number | string }
): Promise<unknown> => {
  const makeCompanyListCacheKey = (q: typeof query) => {
    const keys: Array<keyof typeof query> = ["keyword", "location", "page", "limitItems"];
    const parts: string[] = [];
    for (const k of keys) {
      const v = q[k];
      if (v === undefined || v === null) continue;
      const s = String(v).trim();
      if (!s) continue;
      parts.push(`${String(k)}=${encodeURIComponent(s)}`);
    }
    return `company_list:${parts.join("&") || "all"}`;
  };

  const cacheKey = makeCompanyListCacheKey(query);
  const cached = cache.get<unknown>(cacheKey);
  if (cached) {
    return cached;
  }

  const match: Record<string, unknown> = {
    status: "active",
  };

  if (query.keyword) {
    const kw = String(query.keyword);
    const atlasIds = await findIdsByKeyword({ model: AccountCompany, keyword: kw, atlasPaths: ["companyName", "slug"] }).catch(() => [] as string[]);
    match._id = { $in: atlasIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  if (query.location) {
    const locationSlug = normalizeLocationSlug(query.location);
    const locationInfo = await findLocationByNormalizedSlug(locationSlug);

    if (locationInfo) {
      match.location = locationInfo._id.toString();
    } else {
      match.location = "000000000000000000000000";
    }
  }

  const limitItems = Number(query.limitItems) || paginationConfig.companyList || 12;
  const page = Number(query.page) || 1;
  const skip = (page - 1) * limitItems;

  const bannedCandidateIds = (await getBannedCandidateIds()).map(id => new Types.ObjectId(id));

  interface AggregatedCompanyDoc {
    _id: Types.ObjectId;
    logo?: string;
    companyName: string;
    slug?: string;
    locationName?: string;
    jobCount?: number;
    avgRating?: number;
    reviewCount?: number;
  }

  interface FacetResult {
    metadata: Array<{ total: number }>;
    data: AggregatedCompanyDoc[];
  }

  const results = await AccountCompany.aggregate<FacetResult>([
    { $match: match },
    {
      $lookup: {
        from: "jobs",
        let: { companyId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: {
                $and: [
                  { $eq: ["$companyId", "$$companyId"] },
                  {
                    $or: [
                      { $eq: [{ $type: "$expirationDate" }, "missing"] },
                      { $eq: ["$expirationDate", null] },
                      { $gte: ["$expirationDate", new Date()] }
                    ]
                  }
                ]
              }
            }
          },
          { $project: { _id: 1 } }
        ],
        as: "activeJobs"
      }
    },
    {
      $addFields: { locationObjectId: { $toObjectId: "$location" } }
    },
    {
      $lookup: {
        from: "locations",
        localField: "locationObjectId",
        foreignField: "_id",
        as: "locationInfo"
      }
    },
    { $unwind: { path: "$locationInfo", preserveNullAndEmptyArrays: true } },
    {
      $lookup: {
        from: "reviews",
        let: { companyId: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$companyId", "$$companyId"] },
              status: "approved",
              deleted: false,
              ...(bannedCandidateIds.length > 0 ? { candidateId: { $nin: bannedCandidateIds } } : {})
            }
          },
          {
            $group: {
              _id: null,
              avgRating: { $avg: "$overallRating" },
              reviewCount: { $sum: 1 }
            }
          }
        ],
        as: "reviewStats"
      }
    },
    { $unwind: { path: "$reviewStats", preserveNullAndEmptyArrays: true } },
    {
      $addFields: {
        jobCount: { $size: "$activeJobs" },
        locationName: "$locationInfo.name",
        avgRating: "$reviewStats.avgRating",
        reviewCount: { $ifNull: ["$reviewStats.reviewCount", 0] }
      }
    },
    { $sort: { jobCount: -1, companyName: 1 } },
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [
          { $skip: skip },
          { $limit: limitItems },
          {
            $project: {
              password: 0, token: 0, activeJobs: 0, locationInfo: 0, locationObjectId: 0
            }
          }
        ]
      }
    }
  ]).collation({ locale: "vi", strength: 2 });

  const totalRecord = results[0]?.metadata[0]?.total || 0;
  const companyList = results[0]?.data || [];
  const totalPage = Math.ceil(totalRecord / limitItems);

  const companyIdsFromList = companyList.map(c => c._id);
  const approvedMap = await getApprovedCountsByCompany(companyIdsFromList, CV);

  const companyListFinal = companyList.map(item => {
    const totalApproved = approvedMap.get(item._id.toString()) || 0;
    const badgeResult = calculateCompanyBadges({
      avgRating: item.avgRating,
      reviewCount: item.reviewCount,
      totalApproved,
      activeJobCount: item.jobCount
    });
    return {
      id: item._id,
      logo: item.logo,
      companyName: item.companyName,
      slug: item.slug,
      locationName: item.locationName || "",
      jobCount: item.jobCount || 0,
      totalJob: item.jobCount || 0,
      avgRating: item.avgRating ? Math.round(item.avgRating * 10) / 10 : null,
      reviewCount: item.reviewCount || 0,
      badges: badgeResult.badges
    };
  });

  const response = {
    code: "success",
    message: "Success.",
    companyList: companyListFinal,
    pagination: buildPagination(totalRecord, page, limitItems),
    totalRecord,
    totalPage
  };

  cache.set(cacheKey, response, CACHE_TTL.DYNAMIC);
  return response;
};

export const getCompanyDetailPublicService = async (
  slug: string,
  jobPage: number,
  jobLimit: number
): Promise<{ status: number; code: string; message: string; companyDetail?: unknown; jobList?: unknown[]; jobPagination?: unknown }> => {
  const jobSkip = (jobPage - 1) * jobLimit;

  const companyInfo = await AccountCompany.findOne({
    slug,
    status: "active",
  }).select("_id logo companyName slug address companyModel companyEmployees workingTime workOverTime description benefits location phone website").lean<IAccountCompany>();

  if (!companyInfo) {
    return { status: 404, code: "error", message: "Company not found." };
  }

  const [followerCount, totalJobs, jobs, locationInfo] = await Promise.all([
    FollowCompany.countDocuments({ companyId: companyInfo._id }),
    Job.countDocuments({ companyId: companyInfo._id }),
    Job.find({ companyId: companyInfo._id })
      .select("title slug salaryMin salaryMax position workingForm locations skills createdAt expirationDate maxApproved approvedCount maxApplications applicationCount")
      .sort({ createdAt: "desc" })
      .skip(jobSkip)
      .limit(jobLimit)
      .lean<IJob[]>(),
    Location.findOne({ _id: companyInfo.location }).select("name").lean<Pick<ILocation, "name">>()
  ]);

  const companyDetail = {
    id: companyInfo._id.toString(),
    logo: companyInfo.logo,
    companyName: companyInfo.companyName,
    slug: companyInfo.slug,
    address: companyInfo.address,
    companyModel: companyInfo.companyModel,
    companyEmployees: companyInfo.companyEmployees,
    workingTime: companyInfo.workingTime,
    workOverTime: companyInfo.workOverTime,
    description: companyInfo.description,
    followerCount,
  };

  const allJobLocationIds = [...new Set(
    jobs.flatMap(j => (j.locations || []))
      .map(id => id?.toString?.() || String(id))
      .filter(id => typeof id === "string" && /^[a-f\d]{24}$/i.test(id))
  )];
  const jobLocations = allJobLocationIds.length > 0
    ? await Location.find({ _id: { $in: allJobLocationIds } }).select("name").lean<Pick<ILocation, "_id" | "name">[]>()
    : [];
  const jobLocationMap = new Map(jobLocations.map(c => [c._id.toString(), c.name]));

  const jobList = [];
  for (const item of jobs) {
    const maxApproved = item.maxApproved || 0;
    const approvedCount = item.approvedCount || 0;
    const maxApplications = item.maxApplications || 0;
    const applicationCount = item.applicationCount || 0;
    const isFull = maxApproved > 0 && approvedCount >= maxApproved;
    const skills = item.skills || [];

    const jobLocationNames = (item.locations || [])
      .map(locationId => jobLocationMap.get(locationId?.toString?.() || String(locationId)))
      .filter((name): name is string => Boolean(name));

    const isExpired = item.expirationDate ? new Date(item.expirationDate) < new Date() : false;

    jobList.push({
      id: item._id,
      slug: item.slug,
      companyLogo: companyInfo.logo,
      title: item.title,
      companyName: companyInfo.companyName,
      companySlug: companyInfo.slug,
      salaryMin: item.salaryMin,
      salaryMax: item.salaryMax,
      position: item.position,
      workingForm: item.workingForm,
      companyLocation: locationInfo?.name || "",
      jobLocations: jobLocationNames,
      skills,
      createdAt: item.createdAt,
      isFull,
      isExpired,
      expirationDate: item.expirationDate || null,
      maxApplications,
      maxApproved,
      applicationCount,
      approvedCount
    });
  }

  return {
    status: 200,
    code: "success",
    message: "Success.",
    companyDetail,
    jobList,
    jobPagination: buildPagination(totalJobs, jobPage, jobLimit),
  };
};

export const getFollowerCountService = async (companyId: Types.ObjectId): Promise<{ code: string; followerCount: number }> => {
  const followerCount = await FollowCompany.countDocuments({ companyId });
  return { code: "success", followerCount };
};

export const getCompanyNotificationsService = async (
  companyId: Types.ObjectId,
  page: number
): Promise<{ code: string; notifications: unknown[]; unreadCount: number; pagination: PaginationDTO }> => {
  const pageSize = paginationConfig.notificationsPageSize || 10;
  const skip = (page - 1) * pageSize;

  const [notifications, unreadCount, totalRecord] = await Promise.all([
    Notification.find({ companyId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("title message link read createdAt type")
      .lean(),
    Notification.countDocuments({ companyId, read: false }),
    Notification.countDocuments({ companyId })
  ]);

  return {
    code: "success",
    notifications,
    unreadCount,
    pagination: buildPagination(totalRecord, page, pageSize),
  };
};

export const markCompanyNotificationReadService = async (
  companyId: Types.ObjectId,
  notifId: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!notifId || !/^[a-fA-F0-9]{24}$/.test(notifId)) {
    return { status: 400, code: "error", message: "Invalid notification ID." };
  }

  await Notification.updateOne({ _id: notifId, companyId }, { read: true });
  return { status: 200, code: "success", message: "Notification marked as read." };
};

export const markAllCompanyNotificationsReadService = async (
  companyId: Types.ObjectId
): Promise<{ code: string; message: string }> => {
  await Notification.updateMany({ companyId, read: false }, { read: true });
  return { code: "success", message: "All notifications marked as read." };
};

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
