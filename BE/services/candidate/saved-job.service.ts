import { isObjectId, isDuplicateKeyError } from "../../helpers/db.helper";
import { FilterQuery, Types } from "mongoose";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import SavedJob from "../../models/saved-job.model";
import { paginationConfig } from "../../config/variable";
import { findIdsByKeyword } from "../../helpers/atlas-search.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { ISavedJob } from "../../interfaces/models/saved-job.interface";
import { IJob } from "../../interfaces/models/job.interface";

export const toggleSaveJobService = async (
  candidateId: Types.ObjectId,
  jobId: string
): Promise<{ status: number; code: string; message: string; saved?: boolean }> => {
  if (!isObjectId(jobId)) {
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
  }

  try {
    await SavedJob.create({ candidateId, jobId: new Types.ObjectId(jobId) });
    return { status: 200, code: "success", message: "Job saved.", saved: true };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { status: 200, code: "success", message: "Job saved.", saved: true };
    }
    throw error;
  }
};

export const checkSaveStatusService = async (
  candidateId: Types.ObjectId,
  jobId: string
): Promise<{ status: number; code: string; saved: boolean }> => {
  if (!isObjectId(jobId)) {
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
