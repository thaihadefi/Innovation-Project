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
import { convertToSlug } from "../../helpers/slugify.helper";
import { notificationConfig } from "../../config/variable";

// Toggle follow/unfollow a company
export const toggleFollowCompany = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const companyId = req.params.companyId;

    // Validate companyId
    if (!companyId || !/^[a-fA-F0-9]{24}$/.test(companyId)) {
      res.json({ code: "error", message: "Invalid company!" });
      return;
    }

    // Check if company exists
    const company = await AccountCompany.findById(companyId).select('_id'); // OPTIMIZED: Only check existence
    if (!company) {
      res.json({ code: "error", message: "Company not found!" });
      return;
    }

    // Check if already following
    const existingFollow = await FollowCompany.findOne({
      candidateId: candidateId,
      companyId: companyId
    }).select('_id'); // OPTIMIZED: Only need id for deletion

    if (existingFollow) {
      // Unfollow
      await FollowCompany.deleteOne({ _id: existingFollow._id });
      res.json({
        code: "success",
        message: "Unfollowed successfully!",
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
        message: "Followed successfully!",
        following: true
      });
    }
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    });
  }
}

// Check if following a company
export const checkFollowStatus = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const companyId = req.params.companyId;

    const existingFollow = await FollowCompany.findOne({
      candidateId: candidateId,
      companyId: companyId
    }).select('_id'); // OPTIMIZED: Only check existence

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

    const follows = await FollowCompany.find({ candidateId: candidateId })
      .select('companyId createdAt') // OPTIMIZED: Only need companyId and createdAt
      .sort({ createdAt: -1 })
      .lean();

    const companyIds = follows.map(f => f.companyId);
    
    const companies = await AccountCompany.find({ _id: { $in: companyIds } })
      .select("companyName logo slug")
      .lean();

    res.json({
      code: "success",
      companies: companies
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get followed companies!"
    });
  }
}

// Get notifications for candidate
export const getNotifications = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;

    // Execute find and count in parallel
    const [notifications, unreadCount] = await Promise.all([
      Notification.find({ candidateId: candidateId })
        .sort({ createdAt: -1 })
        .limit(notificationConfig.maxStored)
        .select("title message link read createdAt type")
        .lean(),
      Notification.countDocuments({ 
        candidateId: candidateId, 
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
      message: "Marked as read!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
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
      message: "All marked as read!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    });
  }
}

// Toggle save/unsave a job
export const toggleSaveJob = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId).select('_id'); // OPTIMIZED: Only check existence
    if (!job) {
      return res.json({
        code: "error",
        message: "Job not found!"
      });
    }

    // Check if already saved
    const existingSave = await SavedJob.findOne({ candidateId, jobId }).select('_id'); // OPTIMIZED: Only need id

    if (existingSave) {
      // Unsave
      await SavedJob.deleteOne({ _id: existingSave._id });
      res.json({
        code: "success",
        message: "Job removed from saved!",
        saved: false
      });
    } else {
      // Save
      await SavedJob.create({ candidateId, jobId });
      res.json({
        code: "success",
        message: "Job saved!",
        saved: true
      });
    }
  } catch (error) {
    console.error("toggleSaveJob error:", error);
    res.json({
      code: "error",
      message: "Failed to save job!"
    });
  }
}

// Check if a job is saved
export const checkSaveStatus = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const { jobId } = req.params;

    const existingSave = await SavedJob.findOne({ candidateId, jobId }).select('_id'); // OPTIMIZED: Only check existence

    res.json({
      code: "success",
      saved: !!existingSave
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    });
  }
}

// Get list of saved jobs
export const getSavedJobs = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    // Execute find and count in parallel
    const [savedJobs, total] = await Promise.all([
      SavedJob.find({ candidateId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'jobId',
          select: 'title slug companyId salaryMin salaryMax position workingForm cities technologySlugs createdAt expirationDate', // OPTIMIZED: Only display fields
          populate: {
            path: 'companyId',
            select: 'companyName logo' 
          }
        }),
      SavedJob.countDocuments({ candidateId })
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
      currentPage: page
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get saved jobs!"
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
    const candidate = await AccountCandidate.findById(candidateId).select('email skills'); // OPTIMIZED: Only need email and skills
    
    if (!candidate) {
      res.json({ code: "error", message: "Candidate not found" });
      return;
    }

    // Get candidate skills (from profile)
    const candidateSkills: string[] = (candidate as any).skills || [];
    const skillSlugs = candidateSkills.map((s: string) => convertToSlug(s.toLowerCase()));

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
      // No skills or history - return latest jobs
      const latestJobs = await Job.find({
        _id: { $nin: [...appliedJobIds, ...savedJobIds] },
        $or: [
          { expirationDate: null },
          { expirationDate: { $exists: false } },
          { expirationDate: { $gt: new Date() } }
        ]
      }).select('title slug companyId salaryMin salaryMax position workingForm cities technologySlugs createdAt expirationDate') // OPTIMIZED: Only display fields
        .sort({ createdAt: -1 }).limit(10).lean();

      const jobsWithDetails = await enrichJobsWithDetails(latestJobs);
      
      res.json({
        code: "success",
        recommendations: jobsWithDetails,
        basedOn: "latest"
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
    }).select('title slug companyId salaryMin salaryMax position workingForm cities technologySlugs createdAt expirationDate') // OPTIMIZED: Only needed fields
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

    // Sort by score and take top 10
    scoredJobs.sort((a, b) => b.score - a.score);
    const top10 = scoredJobs.slice(0, 10);

    // Enrich with company details
    const jobsWithDetails = await enrichJobsWithDetails(top10.map(s => s.job));

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
      basedOn: allTechSlugs.slice(0, 5),
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
  const companies = await AccountCompany.find({ _id: { $in: companyIds } }).select('companyName logo slug city').lean(); // OPTIMIZED: Only needed fields
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

  // Bulk fetch all cities (1 query instead of N)
  const cityIds = [...new Set(companies.map(c => c.city?.toString()).filter(Boolean))];
  const cities = cityIds.length > 0 ? await City.find({ _id: { $in: cityIds } }).select('name').lean() : []; // OPTIMIZED: Only need name
  const cityMap = new Map(cities.map((c: any) => [c._id.toString(), c.name]));

  const result = [];
  
  for (const job of jobs) {
    const company = companyMap.get(job.companyId?.toString() || '');
    if (!company) continue;

    const cityName = cityMap.get(company.city?.toString() || '') || "";

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
      technologies: job.technologies,
      technologySlugs: job.technologySlugs,
      createdAt: job.createdAt,
      expirationDate: job.expirationDate
    });
  }

  return result;
}
