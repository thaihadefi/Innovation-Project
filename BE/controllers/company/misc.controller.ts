import { Request, Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import City from "../../models/city.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Notification from "../../models/notification.model";
import JobView from "../../models/job-view.model";
import { convertToSlug } from "../../helpers/slugify.helper";
import { normalizeTechnologyName } from "../../helpers/technology.helper";
import cache, { CACHE_TTL } from "../../helpers/cache.helper";
import { notificationConfig, paginationConfig } from "../../config/variable";

export const topCompanies = async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = "top_companies";
    const cached = cache.get(cacheKey);
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
    });
    
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
    }).select("companyName slug");

    // Map info to counts and sort
    const sortedCompanies = companiesInfo.map(company => ({
      id: company.id,
      companyName: company.companyName,
      slug: company.slug,
      jobCount: companyJobCount[company._id.toString()]
    }))
    .sort((a, b) => b.jobCount - a.jobCount || (a.companyName || "").localeCompare(b.companyName || "", "vi"))
    .slice(0, 5); // Take top 5
    
    const response = {
      code: "success",
      topCompanies: sortedCompanies
    };

    // Cache for 5 minutes (dynamic data - companies change with jobs)
    cache.set(cacheKey, response, CACHE_TTL.DYNAMIC);

    res.json(response);
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to fetch top companies"
    });
  }
}

export const list = async (req: RequestAccount, res: Response) => {
  try {
    // Check cache first
    const cacheKey = `company_list:${JSON.stringify(req.query)}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const match: any = {};
    
    // Filter by keyword (company name)
    if(req.query.keyword) {
      const keyword = req.query.keyword;
      const regex = new RegExp(`${keyword}`, "i");
      match.companyName = regex;
    }

    // Filter by city
    if(req.query.city) {
      const citySlug = req.query.city;
      const cityInfo = await City.findOne({ slug: citySlug });
      if(cityInfo) {
        match.city = cityInfo.id;
      }
    }
    
    let limitItems = 12;
    if(req.query.limitItems) {
      limitItems = parseInt(`${req.query.limitItems}`);
    }

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
      
      // Lookup City for cityName display
      {
        $addFields: { cityObjectId: { $toObjectId: "$city" } }
      },
      { 
        $lookup: {
          from: "cities",
          localField: "cityObjectId",
          foreignField: "_id",
          as: "cityInfo"
        }
      },
      { $unwind: { path: "$cityInfo", preserveNullAndEmptyArrays: true } },

      // Add computed fields
      { 
        $addFields: { 
          jobCount: { $size: "$activeJobs" },
          cityName: "$cityInfo.name"
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
                password: 0, token: 0, activeJobs: 0, cityInfo: 0, cityObjectId: 0 
              } 
            } 
          ]
        }
      }
    ]).collation({ locale: "vi", strength: 2 }); // Vietnamese collation for name sort

    const totalRecord = results[0]?.metadata[0]?.total || 0;
    const companyList = results[0]?.data || [];
    const totalPage = Math.ceil(totalRecord/limitItems);

    const companyListFinal = companyList.map((item: any) => ({
      id: item._id, 
      logo: item.logo,
      companyName: item.companyName,
      slug: item.slug,
      cityName: item.cityName || "",
      jobCount: item.jobCount || 0,
      totalJob: item.jobCount || 0
    }));
  
    const response = {
      code: "success",
      message: "Success!",
      companyList: companyListFinal,
      totalRecord: totalRecord,
      totalPage: totalPage
    };

    // Cache for 5 minutes
    cache.set(cacheKey, response, CACHE_TTL.DYNAMIC);

    res.json(response)
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const detail = async (req: RequestAccount, res: Response) => {
  try {
    const slug = req.params.slug;

    const companyInfo = await AccountCompany.findOne({
      slug: slug
    })

    if(!companyInfo) {
      res.json({
        code: "error",
        message: "Invalid data!"
      })
      return;
    }

    // Get follower count, jobs, and city info in parallel
    const [followerCount, jobs, cityInfo] = await Promise.all([
      FollowCompany.countDocuments({ companyId: companyInfo.id }),
      Job.find({ companyId: companyInfo.id }).sort({ createdAt: "desc" }),
      City.findOne({ _id: companyInfo?.city })
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

    for (const item of jobs) {
      if(companyInfo && cityInfo) {
        // Calculate stats
        const maxApproved = item.maxApproved || 0;
        const approvedCount = item.approvedCount || 0;
        const maxApplications = item.maxApplications || 0;
        const applicationCount = item.applicationCount || 0;
        const isFull = maxApproved > 0 && approvedCount >= maxApproved;
        const technologySlugs = (item.technologies || []).map((t: string) => convertToSlug(normalizeTechnologyName(t)));

        // Check if expired
        const isExpired = item.expirationDate 
          ? new Date(item.expirationDate) < new Date()
          : false;

        const itemFinal = {
          id: item.id,
          slug: item.slug,
          companyLogo: companyInfo.logo,
          title: item.title,
          companyName: companyInfo.companyName,
          companySlug: companyInfo.slug,
          salaryMin: item.salaryMin,
          salaryMax: item.salaryMax,
          position: item.position,
          workingForm: item.workingForm,
          companyCity: cityInfo.name,
          technologies: item.technologies,
          technologySlugs: technologySlugs,
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
  
    res.json({
      code: "success",
      message: "Success!",
      companyDetail: companyDetail,
      jobList: jobList
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
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
    res.json({
      code: "error",
      message: "Failed to get follower count!"
    });
  }
}

// Get notifications for company
export const getCompanyNotifications = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    // Execute find and count in parallel
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ companyId: companyId })
        .sort({ createdAt: -1 })
        .limit(notificationConfig.maxStored)
        .select("title message link read createdAt type"),
      Notification.countDocuments({ 
        companyId: companyId, 
        read: false 
      })
    ]);

    res.json({
      code: "success",
      notifications: notifications,
      unreadCount: unreadCount
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get notifications!"
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
      message: "Notification marked as read!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to mark notification as read!"
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
      message: "All notifications marked as read!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to mark notifications as read!"
    });
  }
}

// Get analytics for company's job postings
export const getAnalytics = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    // Get all jobs for this company
    const jobs = await Job.find({ companyId }).sort({ createdAt: -1 });
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
        id: job.id,
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
      jobs: jobsData
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get analytics!"
    });
  }
}
