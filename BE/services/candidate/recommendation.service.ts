import { isObjectId } from "../../helpers/db.helper";
import { Types } from "mongoose";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import SavedJob from "../../models/saved-job.model";
import Location from "../../models/location.model";
import { discoveryConfig, searchScanLimits } from "../../config/variable";
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
      .filter(isObjectId)
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
