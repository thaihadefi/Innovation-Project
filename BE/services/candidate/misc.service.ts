import { FilterQuery, Types } from "mongoose";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Notification from "../../models/notification.model";
import SavedJob from "../../models/saved-job.model";
import Location from "../../models/location.model";
import { discoveryConfig, paginationConfig, searchScanLimits } from "../../config/variable";
import { findIdsByKeyword } from "../../helpers/atlas-search.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { IFollowCompany } from "../../interfaces/models/follow-company.interface";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import { ISavedJob } from "../../interfaces/models/saved-job.interface";
import { IJob } from "../../interfaces/models/job.interface";
import { ICV } from "../../interfaces/models/cv.interface";
import { ILocation } from "../../interfaces/models/location.interface";

export interface EnrichedJobDTO {
  id: string;
  slug: string;
  title: string;
  companyName: string;
  companySlug?: string;
  companyLogo?: string;
  salaryMin?: number;
  salaryMax?: number;
  position?: string;
  workingForm?: string;
  companyLocation: string;
  jobLocations: string[];
  skills: string[];
  createdAt: Date;
  expirationDate?: Date | null;
}

export const toggleFollowCompanyService = async (
  candidateId: Types.ObjectId,
  companyId: string
): Promise<{ status: number; code: string; message: string; following?: boolean }> => {
  if (!companyId || !/^[a-fA-F0-9]{24}$/.test(companyId)) {
    return { status: 400, code: "error", message: "Invalid company." };
  }

  const company = await AccountCompany.findById(companyId).select("_id").lean();
  if (!company) {
    return { status: 404, code: "error", message: "Company not found." };
  }

  const existingFollow = await FollowCompany.findOne({
    candidateId,
    companyId: new Types.ObjectId(companyId)
  }).select("_id").lean<IFollowCompany>();

  if (existingFollow) {
    await FollowCompany.deleteOne({ _id: existingFollow._id });
    return { status: 200, code: "success", message: "Unfollowed successfully.", following: false };
  } else {
    try {
      const newFollow = new FollowCompany({
        candidateId,
        companyId: new Types.ObjectId(companyId)
      });
      await newFollow.save();
      return { status: 200, code: "success", message: "Followed successfully.", following: true };
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err?.code === 11000) {
        return { status: 200, code: "success", message: "Followed successfully.", following: true };
      }
      throw error;
    }
  }
};

export const checkFollowStatusService = async (
  candidateId: Types.ObjectId,
  companyId: string
): Promise<{ code: string; following: boolean }> => {
  const existingFollow = await FollowCompany.findOne({
    candidateId,
    companyId: new Types.ObjectId(companyId)
  }).select("_id").lean();

  return { code: "success", following: !!existingFollow };
};

export const getFollowedCompaniesService = async (
  candidateId: Types.ObjectId,
  page: number,
  keyword: string
): Promise<{ code: string; companies: unknown[]; pagination: PaginationDTO }> => {
  const pageSize = paginationConfig.candidateFollowedCompanies || 9;
  const skip = (page - 1) * pageSize;

  const followFilter: FilterQuery<IFollowCompany> = { candidateId };
  if (keyword) {
    const atlasIds = await findIdsByKeyword({ model: AccountCompany, keyword, atlasPaths: ["companyName", "slug"] }).catch(() => [] as string[]);
    if (atlasIds.length === 0) {
      return {
        code: "success",
        companies: [],
        pagination: buildPagination(0, page, pageSize),
      };
    }
    followFilter.companyId = { $in: atlasIds.map(id => new Types.ObjectId(id)) };
  }

  const [totalRecord, follows] = await Promise.all([
    FollowCompany.countDocuments(followFilter),
    FollowCompany.find(followFilter)
      .select("companyId createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<IFollowCompany[]>()
  ]);

  const followedIds = follows.map(f => f.companyId?.toString()).filter(Boolean);
  const companies = followedIds.length > 0
    ? await AccountCompany.find({ _id: { $in: followedIds }, status: "active" })
        .select("companyName logo slug")
        .lean<IAccountCompany[]>()
    : [];
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));
  const orderedCompanies = followedIds
    .map(id => companyMap.get(id))
    .filter(Boolean);

  return {
    code: "success",
    companies: orderedCompanies,
    pagination: buildPagination(totalRecord, page, pageSize),
  };
};

export const getCandidateNotificationsService = async (
  candidateId: Types.ObjectId,
  page: number
): Promise<{ code: string; notifications: unknown[]; unreadCount: number; pagination: PaginationDTO }> => {
  const pageSize = paginationConfig.notificationsPageSize || 10;
  const skip = (page - 1) * pageSize;

  const [notifications, unreadCount, totalRecord] = await Promise.all([
    Notification.find({ candidateId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .select("title message link read createdAt type")
      .lean(),
    Notification.countDocuments({ candidateId, read: false }),
    Notification.countDocuments({ candidateId })
  ]);

  return {
    code: "success",
    notifications,
    unreadCount,
    pagination: buildPagination(totalRecord, page, pageSize),
  };
};

export const markCandidateNotificationReadService = async (
  candidateId: Types.ObjectId,
  notificationId: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!notificationId || !/^[a-fA-F0-9]{24}$/.test(notificationId)) {
    return { status: 400, code: "error", message: "Invalid notification ID." };
  }

  await Notification.updateOne(
    { _id: notificationId, candidateId },
    { read: true }
  );

  return { status: 200, code: "success", message: "Marked as read." };
};

export const markAllCandidateNotificationsReadService = async (
  candidateId: Types.ObjectId
): Promise<{ code: string; message: string }> => {
  await Notification.updateMany(
    { candidateId, read: false },
    { read: true }
  );

  return { code: "success", message: "All marked as read." };
};

export const toggleSaveJobService = async (
  candidateId: Types.ObjectId,
  jobId: string
): Promise<{ status: number; code: string; message: string; saved?: boolean }> => {
  if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
    return { status: 400, code: "error", message: "Invalid job ID." };
  }

  const job = await Job.findById(jobId).select("_id").lean();
  if (!job) {
    return { status: 404, code: "error", message: "Job not found." };
  }

  const existingSave = await SavedJob.findOne({ candidateId, jobId: new Types.ObjectId(jobId) }).select("_id").lean<ISavedJob>();

  if (existingSave) {
    await SavedJob.deleteOne({ _id: existingSave._id });
    return { status: 200, code: "success", message: "Job removed from saved.", saved: false };
  } else {
    try {
      await SavedJob.create({ candidateId, jobId: new Types.ObjectId(jobId) });
      return { status: 200, code: "success", message: "Job saved.", saved: true };
    } catch (error: unknown) {
      const err = error as { code?: number };
      if (err?.code === 11000) {
        return { status: 200, code: "success", message: "Job saved.", saved: true };
      }
      throw error;
    }
  }
};

export const checkSaveStatusService = async (
  candidateId: Types.ObjectId,
  jobId: string
): Promise<{ status: number; code: string; saved: boolean }> => {
  if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
    return { status: 400, code: "error", saved: false };
  }

  const existingSave = await SavedJob.findOne({ candidateId, jobId: new Types.ObjectId(jobId) }).select("_id").lean();
  return { status: 200, code: "success", saved: !!existingSave };
};

export const getSavedJobsService = async (
  candidateId: Types.ObjectId,
  page: number,
  keyword: string
): Promise<{ code: string; savedJobs: unknown[]; pagination: PaginationDTO }> => {
  const limit = paginationConfig.savedJobsList || 10;
  const skip = (page - 1) * limit;

  const findSaved: FilterQuery<ISavedJob> = { candidateId };
  if (keyword) {
    const [atlasCompanyIds, atlasJobIds] = await Promise.all([
      findIdsByKeyword({ model: AccountCompany, keyword, atlasPaths: ["companyName", "slug"] }).catch(() => [] as string[]),
      findIdsByKeyword({ model: Job, keyword, atlasPaths: ["title", "description", "position", "workingForm"] }).catch(() => [] as string[]),
    ]);

    const allCompanyIds = atlasCompanyIds;
    const jobsByCompany = allCompanyIds.length > 0
      ? await Job.find({ companyId: { $in: allCompanyIds } }).select("_id").lean<Pick<IJob, "_id">[]>()
      : [];

    const matchingJobIds = [
      ...new Set([
        ...atlasJobIds,
        ...jobsByCompany.map(job => job._id.toString()),
      ]),
    ];
    if (matchingJobIds.length === 0) {
      return {
        code: "success",
        savedJobs: [],
        pagination: buildPagination(0, page, limit),
      };
    }

    findSaved.jobId = { $in: matchingJobIds.map(id => new Types.ObjectId(id)) };
  }

  interface PopulatedSavedJob {
    _id: Types.ObjectId;
    createdAt: Date;
    jobId: {
      _id: Types.ObjectId;
      title: string;
      slug: string;
      salaryMin?: number;
      salaryMax?: number;
      position?: string;
      workingForm?: string;
      locations: Types.ObjectId[];
      skills: string[];
      createdAt: Date;
      expirationDate?: Date | null;
      companyId?: {
        _id: Types.ObjectId;
        companyName: string;
        logo?: string;
        status: string;
      };
    } | null;
  }

  const [savedJobs, total] = await Promise.all([
    SavedJob.find(findSaved)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: "jobId",
        select: "title slug companyId salaryMin salaryMax position workingForm locations skills createdAt expirationDate",
        populate: {
          path: "companyId",
          select: "companyName logo status"
        }
      })
      .lean<PopulatedSavedJob[]>(),
    SavedJob.countDocuments(findSaved)
  ]);

  const validSavedJobs = savedJobs.filter(s => {
    if (!s.jobId || !s.jobId.companyId) return false;
    return s.jobId.companyId.status === "active";
  });

  return {
    code: "success",
    savedJobs: validSavedJobs.map(s => ({
      savedId: s._id,
      savedAt: s.createdAt,
      job: s.jobId
    })),
    pagination: buildPagination(total, page, limit),
  };
};

export const getRecommendationsService = async (
  candidateId: Types.ObjectId
): Promise<{ code: string; recommendations: EnrichedJobDTO[]; basedOn: string[]; fallback?: boolean; message?: string }> => {
  const candidate = await AccountCandidate.findById(candidateId).select("email skills").lean<IAccountCandidate>();
  if (!candidate) {
    return { code: "error", recommendations: [], basedOn: [], message: "Candidate not found" };
  }

  const skills: string[] = candidate.skills || [];

  const [pastApplications, savedJobs] = await Promise.all([
    CV.find({ candidateId: candidate._id }).select("jobId").lean<Pick<ICV, "jobId">[]>(),
    SavedJob.find({ candidateId }).select("jobId").lean<Pick<ISavedJob, "jobId">[]>()
  ]);
  const appliedJobIds = pastApplications.map(cv => cv.jobId);
  const savedJobIds = savedJobs.map(s => s.jobId);

  const appliedJobs = appliedJobIds.length > 0
    ? await Job.find({ _id: { $in: appliedJobIds } }).select("skills").lean<Pick<IJob, "skills">[]>()
    : [];
  const pastSkills: string[] = [];
  appliedJobs.forEach(job => {
    if (job.skills) {
      pastSkills.push(...job.skills);
    }
  });

  const allSkills = [...new Set([...skills, ...pastSkills])];
  if (allSkills.length === 0) {
    return {
      code: "success",
      recommendations: [],
      basedOn: [],
      fallback: false,
      message: "Add skills to your profile to unlock personalized recommendations."
    };
  }

  const matchingJobs = await Job.find({
    _id: { $nin: [...appliedJobIds, ...savedJobIds] },
    skills: { $in: allSkills },
    $or: [
      { expirationDate: null },
      { expirationDate: { $exists: false } },
      { expirationDate: { $gt: new Date() } }
    ]
  })
    .select("title slug companyId salaryMin salaryMax position workingForm locations skills createdAt expirationDate")
    .limit(searchScanLimits.jobRecommendationScan)
    .lean<IJob[]>();

  const scoredJobs = matchingJobs.map(job => {
    let score = 0;
    const jobSkills = job.skills || [];

    skills.forEach(skill => {
      if (jobSkills.includes(skill)) score += 3;
    });

    pastSkills.forEach(skill => {
      if (jobSkills.includes(skill) && !skills.includes(skill)) score += 1;
    });

    return { job, score };
  });

  scoredJobs.sort((a, b) => b.score - a.score);
  const topRecommendations = scoredJobs.slice(0, discoveryConfig.candidateRecommendationLimit);

  const jobsWithDetails = await enrichJobsWithDetails(topRecommendations.map(s => s.job));

  let message = "";
  if (jobsWithDetails.length === 0) {
    const totalMatchingInDB = await Job.countDocuments({
      skills: { $in: allSkills },
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

  return {
    code: "success",
    recommendations: jobsWithDetails,
    basedOn: allSkills.slice(0, discoveryConfig.candidateRecommendationBasedOnLimit),
    message
  };
};

export async function enrichJobsWithDetails(jobs: IJob[]): Promise<EnrichedJobDTO[]> {
  if (jobs.length === 0) return [];

  const companyIds = [...new Set(jobs.map(j => j.companyId?.toString()).filter(Boolean))];
  const companies = await AccountCompany.find({ _id: { $in: companyIds }, status: "active" })
    .select("companyName logo slug location")
    .lean<IAccountCompany[]>();
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

  const locationIds = [...new Set(companies.map(c => c.location?.toString()).filter(Boolean))];
  const locations = locationIds.length > 0
    ? await Location.find({ _id: { $in: locationIds } }).select("name").lean<Pick<ILocation, "_id" | "name">[]>()
    : [];
  const locationMap = new Map(locations.map(c => [c._id.toString(), c.name]));

  const allJobLocationIds = [...new Set(
    jobs.flatMap(j => (j.locations || []))
      .map(id => id?.toString?.() || String(id))
      .filter(id => typeof id === "string" && /^[a-f\d]{24}$/i.test(id))
  )];
  const jobLocations = allJobLocationIds.length > 0
    ? await Location.find({ _id: { $in: allJobLocationIds } }).select("name").lean<Pick<ILocation, "_id" | "name">[]>()
    : [];
  const jobLocationMap = new Map(jobLocations.map(c => [c._id.toString(), c.name]));

  const result: EnrichedJobDTO[] = [];

  for (const job of jobs) {
    const company = companyMap.get(job.companyId?.toString() || "");
    if (!company) continue;

    const locationName = locationMap.get(company.location?.toString() || "") || "";
    const jobLocationNames = (job.locations || [])
      .map(locationId => jobLocationMap.get(locationId?.toString?.() || String(locationId)))
      .filter((name): name is string => Boolean(name));

    result.push({
      id: job._id.toString(),
      slug: job.slug,
      title: job.title,
      companyName: company.companyName,
      companySlug: company.slug,
      companyLogo: company.logo,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      position: job.position,
      workingForm: job.workingForm,
      companyLocation: locationName,
      jobLocations: jobLocationNames,
      skills: job.skills || [],
      createdAt: job.createdAt,
      expirationDate: job.expirationDate
    });
  }

  return result;
}
