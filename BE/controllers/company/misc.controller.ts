import { Request, Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import Location from "../../models/location.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Notification from "../../models/notification.model";
import JobView from "../../models/job-view.model";
import cache, { CACHE_TTL } from "../../helpers/cache.helper";
import { discoveryConfig, paginationConfig } from "../../config/variable";
import { calculateCompanyBadges, getApprovedCountsByCompany } from "../../helpers/company-badges.helper";
import { buildSafeRegexFromQuery } from "../../helpers/query.helper";
import {
  findLocationByNormalizedSlug,
  normalizeLocationSlug,
} from "../../helpers/location.helper";

export const topCompanies = async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = "top_companies";
    const cached = await cache.getAsync(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get only active jobs (not expired) and count by company
    const allJobs = await Job.find({
      $or: [
        { expirationDate: { $exists: false } },
        { expirationDate: null },
        { expirationDate: { $gte: new Date() } }
      ]
    }).select('companyId').lean(); // Only need companyId
    
    const companyJobCount: { [key: string]: number } = {};
    
    allJobs.forEach(job => {
      if (job.companyId) {
        const companyIdStr = job.companyId.toString();
        companyJobCount[companyIdStr] = (companyJobCount[companyIdStr] || 0) + 1;
      }
    });

    // Get all company IDs with jobs
    const companyIds = Object.keys(companyJobCount);

    // Fetch basic info (name) for all these companies to sort by name
    const companiesInfo = await AccountCompany.find({ 
      _id: { $in: companyIds } 
    }).select("companyName slug logo location").lean(); // Only needed fields

    // Fetch review stats for all companies in one query
    const Review = (await import("../../models/review.model")).default;
    const Location = (await import("../../models/location.model")).default;
    
    const reviewStats = await Review.aggregate([
      { 
        $match: { 
          companyId: { $in: companiesInfo.map(c => c._id) },
          status: "approved"
        } 
      },
      {
        $group: {
          _id: "$companyId",
          avgRating: { $avg: "$overallRating" },
          reviewCount: { $sum: 1 }
        }
      }
    ]);
    
    // Create review stats map for O(1) lookup
    const reviewStatsMap = new Map(
      reviewStats.map(r => [r._id.toString(), { avgRating: r.avgRating, reviewCount: r.reviewCount }])
    );

    // Get location IDs and fetch location names
    const locationIds = companiesInfo.map(c => c.location).filter(Boolean);
    const locations = await Location.find({ _id: { $in: locationIds } }).select("_id name").lean();
    const locationMap = new Map(locations.map(c => [c._id.toString(), c.name]));

    // Get approved stats for badges
    const topCompanyIds = companiesInfo.map(c => c._id);
    const approvedMapTop = await getApprovedCountsByCompany(topCompanyIds, CV);

    // Map info to counts and sort
    const sortedCompanies = companiesInfo.map(company => {
      const stats = reviewStatsMap.get(company._id.toString());
      const totalApproved = approvedMapTop.get(company._id.toString()) || 0;
      const jobCount = companyJobCount[company._id.toString()];
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

    // Cache for 5 minutes (dynamic data - companies change with jobs)
    cache.set(cacheKey, response, CACHE_TTL.DYNAMIC);

    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed to fetch top companies"
    });
  }
}

export const list = async (req: RequestAccount, res: Response) => {
  try {
    const makeCompanyListCacheKey = (q: any) => {
      const keys = ['keyword', 'location', 'page', 'limitItems'];
      const parts: string[] = [];
      for (const k of keys) {
        const v = q[k];
        if (v === undefined || v === null) continue;
        const s = String(v).trim();
        if (!s) continue;
        parts.push(`${k}=${encodeURIComponent(s)}`);
      }
      return `company_list:${parts.join('&') || 'all'}`;
    };

    // Check cache first
    const cacheKey = makeCompanyListCacheKey(req.query);
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const match: any = {};
    
    // Filter by keyword (company name)
    if(req.query.keyword) {
      const keywordRegex = buildSafeRegexFromQuery(req.query.keyword);
      if (keywordRegex) {
        match.companyName = keywordRegex;
      }
    }

    // Filter by location
    if(req.query.location) {
      const locationSlug = normalizeLocationSlug(req.query.location);
      const locationInfo = await findLocationByNormalizedSlug(locationSlug);

      if(locationInfo) {
        match.location = locationInfo._id.toString();
      } else {
        // Return empty result set when requested location does not exist.
        match.location = "000000000000000000000000";
      }
    }
    
    const defaultLimitItems = paginationConfig.companyList || 12;
    const maxLimitItems = paginationConfig.maxPageSize || 50;
    let limitItems = req.query.limitItems ? parseInt(`${req.query.limitItems}`) : defaultLimitItems;
    if (!Number.isFinite(limitItems) || limitItems <= 0) {
      limitItems = defaultLimitItems;
    }
    limitItems = Math.min(limitItems, maxLimitItems);

    // Pagination
    let page = 1;
    if(req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const skip = (page - 1) * limitItems;

    // Aggregation Pipeline
    const results = await AccountCompany.aggregate([
      // Filter companies
      { $match: match },
      
      // Lookup ACTIVE jobs to count
      {
        $lookup: {
          from: "jobs",
          let: { companyId: "$_id" },
          pipeline: [
            { $match:
              { $expr:
                { $and:
                  [
                    { $eq: ["$companyId", "$$companyId"] },
                    // Active job logic
                    { $or: [
                      { $eq: [{ $type: "$expirationDate" }, "missing"] },
                      { $eq: ["$expirationDate", null] },
                      { $gte: ["$expirationDate", new Date()] }
                    ]}
                  ]
                }
              }
            },
            { $project: { _id: 1 } } // Optimize: only need ID to count
          ],
          as: "activeJobs"
        }
      },
      
      // Lookup Location for locationName display
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

      // Lookup Reviews for rating stats
      {
        $lookup: {
          from: "reviews",
          let: { companyId: "$_id" },
          pipeline: [
            { 
              $match: { 
                $expr: { $eq: ["$companyId", "$$companyId"] },
                status: "approved"
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

      // Add computed fields
      { 
        $addFields: { 
          jobCount: { $size: "$activeJobs" },
          locationName: "$locationInfo.name",
          avgRating: "$reviewStats.avgRating",
          reviewCount: { $ifNull: ["$reviewStats.reviewCount", 0] }
        } 
      },
      
      // Sort: Job Count DESC -> Name ASC (Tie-breaker)
      { $sort: { jobCount: -1, companyName: 1 } },
      
      // Facet for Pagination metadata and data
      {
        $facet: {
          metadata: [ { $count: "total" } ],
          data: [ 
            { $skip: skip }, 
            { $limit: limitItems },
            // Project needed fields for CardCompanyItem
            { 
              $project: { 
                password: 0, token: 0, activeJobs: 0, locationInfo: 0, locationObjectId: 0 
              } 
            } 
          ]
        }
      }
    ]).collation({ locale: "vi", strength: 2 }); // Vietnamese collation for name sort

    const totalRecord = results[0]?.metadata[0]?.total || 0;
    const companyList = results[0]?.data || [];
    const totalPage = Math.ceil(totalRecord/limitItems);

    // Get approved stats for badges
    const companyIdsFromList = companyList.map((c: any) => c._id);
    const approvedMap = await getApprovedCountsByCompany(companyIdsFromList, CV);

    const companyListFinal = companyList.map((item: any) => {
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
      totalRecord: totalRecord,
      totalPage: totalPage
    };

    // Cache for 5 minutes
    cache.set(cacheKey, response, CACHE_TTL.DYNAMIC);

    res.json(response)
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Internal server error."
    })
  }
}

export const detail = async (req: RequestAccount, res: Response) => {
  try {
    const slug = req.params.slug;
    const jobPage = Math.max(1, parseInt(String(req.query.jobPage || "1"), 10) || 1);
    const defaultJobLimit = paginationConfig.companyDetailJobs || 9;
    const maxJobLimit = paginationConfig.maxCompanyDetailJobPageSize || paginationConfig.maxPageSize || 30;
    const requestedLimit = Math.max(1, parseInt(String(req.query.jobLimit || String(defaultJobLimit)), 10) || defaultJobLimit);
    const jobLimit = Math.min(requestedLimit, maxJobLimit);
    const jobSkip = (jobPage - 1) * jobLimit;

    const companyInfo = await AccountCompany.findOne({
      slug: slug
    }).select('_id logo companyName slug address companyModel companyEmployees workingTime description benefits location phone website') // Only needed fields

    if(!companyInfo) {
      res.status(500).json({
      code: "error",
      message: "Internal server error."
      })
      return;
    }

    // Get follower count, jobs, and location info in parallel
    const [followerCount, totalJobs, jobs, locationInfo] = await Promise.all([
      FollowCompany.countDocuments({ companyId: companyInfo.id }),
      Job.countDocuments({ companyId: companyInfo.id }),
      Job.find({ companyId: companyInfo.id })
        .select('title slug salaryMin salaryMax position workingForm locations skillSlugs createdAt expirationDate')
        .sort({ createdAt: "desc" })
        .skip(jobSkip)
        .limit(jobLimit)
        .lean(), // Only display fields
      Location.findOne({ _id: companyInfo?.location }).select('name').lean() // Only need name
    ]);

    const companyDetail = {
      id: companyInfo.id,
      logo: companyInfo.logo,
      companyName: companyInfo.companyName,
      slug: companyInfo.slug,
      address: companyInfo.address,
      companyModel: companyInfo.companyModel,
      companyEmployees: companyInfo.companyEmployees,
      workingTime: companyInfo.workingTime,
      workOverTime: companyInfo.workOverTime,
      description: companyInfo.description,
      followerCount: followerCount,
    };

    const jobList = [];

    // Resolve job location names in bulk
    const allJobLocationIds = [...new Set(
      jobs.flatMap(j => (j.locations || []) as string[])
        .filter((id: string) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
    )];
    const jobLocations = allJobLocationIds.length > 0
      ? await Location.find({ _id: { $in: allJobLocationIds } }).select('name').lean()
      : [];
    const jobLocationMap = new Map(jobLocations.map((c: any) => [c._id.toString(), c.name]));

    for (const item of jobs) {
      if(companyInfo) {
        // Calculate stats
        const maxApproved = item.maxApproved || 0;
        const approvedCount = item.approvedCount || 0;
        const maxApplications = item.maxApplications || 0;
        const applicationCount = item.applicationCount || 0;
        const isFull = maxApproved > 0 && approvedCount >= maxApproved;
        const skillSlugs = item.skillSlugs || [];

        const jobLocationNames = ((item.locations || []) as string[])
          .map(locationId => jobLocationMap.get(locationId?.toString()))
          .filter(Boolean) as string[];

        // Check if expired
        const isExpired = item.expirationDate 
          ? new Date(item.expirationDate) < new Date()
          : false;

        const itemFinal = {
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
          skillSlugs: skillSlugs,
          createdAt: item.createdAt,
          isFull: isFull,
          isExpired: isExpired,
          expirationDate: item.expirationDate || null,
          maxApplications: maxApplications,
          maxApproved: maxApproved,
          applicationCount: applicationCount,
          approvedCount: approvedCount
        };
        jobList.push(itemFinal);
      }
    }

    const jobPagination = {
      totalRecord: totalJobs,
      totalPage: Math.max(1, Math.ceil(totalJobs / jobLimit)),
      currentPage: jobPage,
      pageSize: jobLimit
    };
  
    res.json({
      code: "success",
      message: "Success.",
      companyDetail: companyDetail,
      jobList: jobList,
      jobPagination
    })
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Internal server error."
    })
  }
}

// Get follower count for company
export const getFollowerCount = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    const followerCount = await FollowCompany.countDocuments({ companyId: companyId });

    res.json({
      code: "success",
      followerCount: followerCount
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed to get follower count."
    });
  }
}

// Get notifications for company
export const getCompanyNotifications = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = paginationConfig.notificationsPageSize || 10;
    const skip = (page - 1) * pageSize;

    const [notifications, unreadCount, totalRecord] = await Promise.all([
      Notification.find({ companyId: companyId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select("title message link read createdAt type")
        .lean(),
      Notification.countDocuments({ 
        companyId: companyId, 
        read: false 
      }),
      Notification.countDocuments({ companyId: companyId })
    ]);

    res.json({
      code: "success",
      notifications: notifications,
      unreadCount: unreadCount,
      pagination: {
        totalRecord,
        totalPage: Math.max(1, Math.ceil(totalRecord / pageSize)),
        currentPage: page,
        pageSize
      }
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed to get notifications."
    });
  }
}

// Mark single notification as read for company
export const markCompanyNotificationRead = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const notifId = req.params.id;

    await Notification.updateOne(
      { _id: notifId, companyId: companyId },
      { read: true }
    );

    res.json({
      code: "success",
      message: "Notification marked as read."
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed to mark notification as read."
    });
  }
}

// Mark all notifications as read for company
export const markAllCompanyNotificationsRead = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    await Notification.updateMany(
      { companyId: companyId, read: false },
      { read: true }
    );

    res.json({
      code: "success",
      message: "All notifications marked as read."
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed to mark notifications as read."
    });
  }
}

// Get analytics for company's job postings
export const getAnalytics = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = paginationConfig.companyJobList || 6;
    const timeRangeInput = String(req.query.timeRange || "30d");
    const sortByInput = String(req.query.sortBy || "views");
    const timeRange = (["7d", "30d", "90d", "all"] as const).includes(timeRangeInput as any) ? timeRangeInput as "7d" | "30d" | "90d" | "all" : "30d";
    const sortBy = (["views", "applications", "approved"] as const).includes(sortByInput as any) ? sortByInput as "views" | "applications" | "approved" : "views";

    // Get all jobs for this company
    const jobs = await Job.find({ companyId }).select('_id title slug viewCount expirationDate createdAt').sort({ createdAt: -1 }).lean(); // Only fields needed for analytics
    // CV.jobId is now ObjectId, use ObjectId directly
    const jobIds = jobs.map((j: any) => j._id);

    // Count CVs by status for this company's jobs
    const cvCounts = await CV.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const statusCounts: Record<string, number> = {};
    cvCounts.forEach((c: any) => {
      statusCounts[c._id] = c.count;
    });

    const totalInitial = statusCounts["initial"] || 0;
    const totalViewed = statusCounts["viewed"] || 0;
    const totalApproved = statusCounts["approved"] || 0;
    const totalRejected = statusCounts["rejected"] || 0;
    const totalApplications = totalInitial + totalViewed + totalApproved + totalRejected;

    // Calculate overview metrics from actual data
    let totalViews = 0;

    const jobIdObjects = jobs.map((j: any) => j._id);
    
    const cvAggregation = await CV.aggregate([
      { $match: { jobId: { $in: jobIdObjects } } },
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
    
    // Create lookup map for O(1) access - use ObjectId toString for comparison
    const cvCountMap = new Map(cvAggregation.map((c: any) => [c._id.toString(), c]));

    const jobsData = jobs.map((job: any) => {
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
        applyRate: parseFloat(applyRate as string) || 0,
        approvalRate: parseFloat(approvalRate as string) || 0,
        createdAt: job.createdAt,
        isExpired: job.expirationDate ? new Date(job.expirationDate) < new Date() : false
      };
    });

    // Calculate overall rates
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
    const filteredJobs = jobsData.filter((job: any) => {
      if (timeRange === "all") return true;
      const createdAt = new Date(job.createdAt).getTime();
      return now - createdAt <= rangeToMs[timeRange];
    });

    const topJobsLimit = 10;
    const chartJobs = filteredJobs
      .slice()
      .sort((a: any, b: any) => {
        const aMetric = Number(a[sortBy] || 0);
        const bMetric = Number(b[sortBy] || 0);
        if (bMetric !== aMetric) return bMetric - aMetric;
        return (a.title || "").localeCompare(b.title || "");
      })
      .slice(0, topJobsLimit)
      .map((job: any) => ({
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

    res.json({
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
      jobsPagination: {
        totalRecord: totalFiltered,
        totalPage,
        currentPage: safePage,
        pageSize
      },
      hasAnyJobs: jobsData.length > 0
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed to get analytics."
    });
  }
}
