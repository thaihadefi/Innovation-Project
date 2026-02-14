import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Notification from "../../models/notification.model";
import SavedJob from "../../models/saved-job.model";
import City from "../../models/city.model";
import { normalizeTechnologyKey } from "../../helpers/technology.helper";
import { discoveryConfig, paginationConfig } from "../../config/variable";

// Toggle follow/unfollow a company
export const toggleFollowCompany = async (req: RequestAccount<{ companyId: string }>, res: Response) => {
  try {
    const candidateId = req.account.id;
    const companyId = req.params.companyId;

    // Validate companyId
    if (!companyId || !/^[a-fA-F0-9]{24}$/.test(companyId)) {
      res.json({ code: "error", message: "Invalid company." });
      return;
    }

    // Check if company exists
    const company = await AccountCompany.findById(companyId).select('_id').lean(); // Only check existence
    if (!company) {
      res.json({ code: "error", message: "Company not found." });
      return;
    }

    // Check if already following
    const existingFollow = await FollowCompany.findOne({
      candidateId: candidateId,
      companyId: companyId
    }).select('_id').lean(); // Only need id for deletion

    if (existingFollow) {
      // Unfollow
      await FollowCompany.deleteOne({ _id: existingFollow._id });
      res.json({
        code: "success",
        message: "Unfollowed successfully.",
        following: false
      });
    } else {
      // Follow
      const newFollow = new FollowCompany({
        candidateId: candidateId,
        companyId: companyId
      });
      await newFollow.save();
      res.json({
        code: "success",
        message: "Followed successfully.",
        following: true
      });
    }
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed."
    });
  }
}

// Check if following a company
export const checkFollowStatus = async (req: RequestAccount<{ companyId: string }>, res: Response) => {
  try {
    const candidateId = req.account.id;
    const companyId = req.params.companyId;

    const existingFollow = await FollowCompany.findOne({
      candidateId: candidateId,
      companyId: companyId
    }).select('_id').lean(); // Only check existence

    res.json({
      code: "success",
      following: !!existingFollow
    });
  } catch (error) {
    res.json({
      code: "error",
      following: false
    });
  }
}

// Get list of followed companies
export const getFollowedCompanies = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = paginationConfig.candidateFollowedCompanies || 9;
    const skip = (page - 1) * pageSize;
    const keyword = String(req.query.keyword || "").trim();

    const followFilter: any = { candidateId: candidateId };
    if (keyword) {
      const companyRegex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const matchingCompanies = await AccountCompany.find({ companyName: companyRegex }).select("_id").lean();
      const companyIds = matchingCompanies.map((c: any) => c._id);
      if (companyIds.length === 0) {
        res.json({
          code: "success",
          companies: [],
          pagination: {
            totalRecord: 0,
            totalPage: 1,
            currentPage: page,
            pageSize
          }
        });
        return;
      }
      followFilter.companyId = { $in: companyIds };
    }

    const [totalRecord, follows] = await Promise.all([
      FollowCompany.countDocuments(followFilter),
      FollowCompany.find(followFilter)
        .select("companyId createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
    ]);

    const followedIds = follows.map((f: any) => f.companyId?.toString()).filter(Boolean);
    const companies = followedIds.length > 0
      ? await AccountCompany.find({ _id: { $in: followedIds } })
          .select("companyName logo slug")
          .lean()
      : [];
    const companyMap = new Map(companies.map((c: any) => [c._id.toString(), c]));
    const orderedCompanies = followedIds
      .map((id: string) => companyMap.get(id))
      .filter(Boolean);

    res.json({
      code: "success",
      companies: orderedCompanies,
      pagination: {
        totalRecord,
        totalPage: Math.max(1, Math.ceil(totalRecord / pageSize)),
        currentPage: page,
        pageSize
      }
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get followed companies."
    });
  }
}

// Get notifications for candidate
export const getNotifications = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = paginationConfig.notificationsPageSize || 10;
    const skip = (page - 1) * pageSize;

    const [notifications, unreadCount, totalRecord] = await Promise.all([
      Notification.find({ candidateId: candidateId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .select("title message link read createdAt type")
        .lean(),
      Notification.countDocuments({ 
        candidateId: candidateId, 
        read: false 
      }),
      Notification.countDocuments({ candidateId: candidateId })
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
    res.json({
      code: "error",
      message: "Failed to get notifications."
    });
  }
}

// Mark notification as read
export const markNotificationRead = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const notificationId = req.params.notificationId;

    await Notification.updateOne(
      { _id: notificationId, candidateId: candidateId },
      { read: true }
    );

    res.json({
      code: "success",
      message: "Marked as read."
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed."
    });
  }
}

// Mark all notifications as read
export const markAllNotificationsRead = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;

    await Notification.updateMany(
      { candidateId: candidateId, read: false },
      { read: true }
    );

    res.json({
      code: "success",
      message: "All marked as read."
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed."
    });
  }
}

// Toggle save/unsave a job
export const toggleSaveJob = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId).select('_id').lean(); // Only check existence
    if (!job) {
      return res.json({
        code: "error",
        message: "Job not found."
      });
    }

    // Check if already saved
    const existingSave = await SavedJob.findOne({ candidateId, jobId }).select('_id').lean(); // Only need id

    if (existingSave) {
      // Unsave
      await SavedJob.deleteOne({ _id: existingSave._id });
      res.json({
        code: "success",
        message: "Job removed from saved.",
        saved: false
      });
    } else {
      // Save
      await SavedJob.create({ candidateId, jobId });
      res.json({
        code: "success",
        message: "Job saved.",
        saved: true
      });
    }
  } catch (error) {
    console.error("toggleSaveJob error:", error);
    res.json({
      code: "error",
      message: "Failed to save job."
    });
  }
}

// Check if a job is saved
export const checkSaveStatus = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const { jobId } = req.params;

    const existingSave = await SavedJob.findOne({ candidateId, jobId }).select('_id').lean(); // Only check existence

    res.json({
      code: "success",
      saved: !!existingSave
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed."
    });
  }
}

// Get list of saved jobs
export const getSavedJobs = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = paginationConfig.savedJobsList || 10;
    const skip = (page - 1) * limit;
    const keyword = String(req.query.keyword || "").trim();

    const findSaved: any = { candidateId };
    if (keyword) {
      const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const keywordRegex = new RegExp(safeKeyword, "i");

      const matchingCompanies = await AccountCompany.find({ companyName: keywordRegex })
        .select("_id")
        .lean();
      const matchingCompanyIds = matchingCompanies.map((c: any) => c._id);

      const matchingJobs = await Job.find({
        $or: [
          { title: keywordRegex },
          ...(matchingCompanyIds.length > 0 ? [{ companyId: { $in: matchingCompanyIds } }] : []),
        ],
      }).select("_id").lean();

      const matchingJobIds = matchingJobs.map((j: any) => j._id);
      if (matchingJobIds.length === 0) {
        res.json({
          code: "success",
          savedJobs: [],
          totalPages: 1,
          currentPage: page,
          pagination: {
            totalRecord: 0,
            totalPage: 1,
            currentPage: page,
            pageSize: limit
          }
        });
        return;
      }

      findSaved.jobId = { $in: matchingJobIds };
    }

    // Execute find and count in parallel
    const [savedJobs, total] = await Promise.all([
      SavedJob.find(findSaved)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'jobId',
          select: 'title slug companyId salaryMin salaryMax position workingForm cities technologySlugs createdAt expirationDate', // Only display fields
          populate: {
            path: 'companyId',
            select: 'companyName logo' 
          }
        }),
      SavedJob.countDocuments(findSaved)
    ]);

    // Filter out null jobs (deleted jobs)
    const validSavedJobs = savedJobs.filter(s => s.jobId !== null);

    res.json({
      code: "success",
      savedJobs: validSavedJobs.map(s => ({
        savedId: s._id,
        savedAt: s.createdAt,
        job: s.jobId
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / limit)),
        currentPage: page,
        pageSize: limit
      }
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get saved jobs."
    });
  }
}

export const getRecommendations = async (req: RequestAccount, res: Response) => {
  try {
    if (!req.account) {
      res.json({ code: "error", message: "Unauthorized" });
      return;
    }

    const candidateId = req.account.id;
    const candidate = await AccountCandidate.findById(candidateId).select('email skills').lean(); // Only need email and skills
    
    if (!candidate) {
      res.json({ code: "error", message: "Candidate not found" });
      return;
    }

    // Get candidate skills (from profile)
    const candidateSkills: string[] = (candidate as any).skills || [];
    const skillSlugs = candidateSkills
      .map((s: string) => normalizeTechnologyKey(s))
      .filter(Boolean);

    // Get technologies from past applications
    const pastApplications = await CV.find({ email: candidate.email }).select("jobId").lean();
    const appliedJobIds = pastApplications.map(cv => cv.jobId);
    
    // Get technologies from applied jobs
    const appliedJobs = await Job.find({ _id: { $in: appliedJobIds } }).select("technologySlugs").lean();
    const pastTechSlugs: string[] = [];
    appliedJobs.forEach(job => {
      if (job.technologySlugs) {
        pastTechSlugs.push(...(job.technologySlugs as string[]));
      }
    });

    // Get saved job IDs to exclude
    const savedJobs = await SavedJob.find({ candidateId }).select("jobId").lean();
    const savedJobIds = savedJobs.map(s => s.jobId);

    // Combine all tech slugs (remove duplicates)
    const allTechSlugs = [...new Set([...skillSlugs, ...pastTechSlugs])];

    if (allTechSlugs.length === 0) {
      // Best-practice personalization: no cold-start fallback to "latest jobs"
      // so users clearly understand they need profile/history signals first.
      res.json({
        code: "success",
        recommendations: [],
        basedOn: [],
        fallback: false,
        message: "Add skills to your profile to unlock personalized recommendations."
      });
      return;
    }

    // Find jobs matching technologies (exclude applied and saved)
    const matchingJobs = await Job.find({
      _id: { $nin: [...appliedJobIds, ...savedJobIds] },
      technologySlugs: { $in: allTechSlugs },
      $or: [
        { expirationDate: null },
        { expirationDate: { $exists: false } },
        { expirationDate: { $gt: new Date() } }
      ]
    }).select('title slug companyId salaryMin salaryMax position workingForm cities technologySlugs createdAt expirationDate') // Only needed fields
      .lean();

    // Calculate weighted score for each job
    const scoredJobs = matchingJobs.map(job => {
      let score = 0;
      const jobTechs = (job.technologySlugs as string[]) || [];

      // Skill match: 3 points each
      skillSlugs.forEach(skill => {
        if (jobTechs.includes(skill)) score += 3;
      });

      // Past application tech match: 1 point each (only if not already in profile skills)
      pastTechSlugs.forEach(tech => {
        if (jobTechs.includes(tech) && !skillSlugs.includes(tech)) score += 1;
      });

      return { job, score };
    });

    // Sort by score and take top recommendations
    scoredJobs.sort((a, b) => b.score - a.score);
    const topRecommendations = scoredJobs.slice(0, discoveryConfig.candidateRecommendationLimit);

    // Enrich with company details
    const jobsWithDetails = await enrichJobsWithDetails(topRecommendations.map(s => s.job));

    // Prepare message if no results
    let message = "";
    if (jobsWithDetails.length === 0) {
      // Check if there are matching jobs but all applied/saved
      const totalMatchingInDB = await Job.countDocuments({
        technologySlugs: { $in: allTechSlugs },
        $or: [
          { expirationDate: null },
          { expirationDate: { $exists: false } },
          { expirationDate: { $gt: new Date() } }
        ]
      });
      
      if (totalMatchingInDB > 0) {
        message = "All matching jobs have been applied or saved";
      } else {
        message = "No jobs match your skills";
      }
    }

    res.json({
      code: "success",
      recommendations: jobsWithDetails,
      basedOn: allTechSlugs.slice(0, discoveryConfig.candidateRecommendationBasedOnLimit),
      message: message
    });

  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get recommendations"
    });
  }
};

// Helper to enrich jobs with company details
async function enrichJobsWithDetails(jobs: any[]) {
  if (jobs.length === 0) return [];

  // Bulk fetch all companies (1 query instead of N)
  const companyIds = [...new Set(jobs.map(j => j.companyId?.toString()).filter(Boolean))];
  const companies = await AccountCompany.find({ _id: { $in: companyIds } }).select('companyName logo slug city').lean(); // Only needed fields
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

  // Bulk fetch company cities (1 query instead of N)
  const cityIds = [...new Set(companies.map(c => c.city?.toString()).filter(Boolean))];
  const cities = cityIds.length > 0 ? await City.find({ _id: { $in: cityIds } }).select('name').lean() : []; // Only need name
  const cityMap = new Map(cities.map((c: any) => [c._id.toString(), c.name]));

  // Bulk fetch job cities (1 query instead of N)
  const allJobCityIds = [...new Set(
    jobs.flatMap(j => (j.cities || []) as any[])
      .map((id: any) => id?.toString?.() || id)
      .filter((id: any) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
  )];
  const jobCities = allJobCityIds.length > 0
    ? await City.find({ _id: { $in: allJobCityIds } }).select('name').lean()
    : [];
  const jobCityMap = new Map(jobCities.map((c: any) => [c._id.toString(), c.name]));

  const result = [];
  
  for (const job of jobs) {
    const company = companyMap.get(job.companyId?.toString() || '');
    if (!company) continue;

    const cityName = cityMap.get(company.city?.toString() || '') || "";
    const jobCityNames = ((job.cities || []) as any[])
      .map((cityId: any) => jobCityMap.get(cityId?.toString?.() || cityId))
      .filter(Boolean) as string[];

    result.push({
      id: job.id,
      slug: job.slug,
      title: job.title,
      companyName: company.companyName,
      companySlug: company.slug,
      companyLogo: company.logo,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      position: job.position,
      workingForm: job.workingForm,
      companyCity: cityName,
      jobCities: jobCityNames,
      technologies: job.technologies,
      technologySlugs: job.technologySlugs,
      createdAt: job.createdAt,
      expirationDate: job.expirationDate
    });
  }

  return result;
}
