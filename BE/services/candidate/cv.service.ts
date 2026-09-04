import { FilterQuery, Types } from "mongoose";
import CV from "../../models/cv.model";
import Job from "../../models/job.model";
import AccountCompany from "../../models/account-company.model";
import Location from "../../models/location.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { paginationConfig } from "../../config/variable";
import { findIdsByKeyword } from "../../helpers/atlas-search.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { ICV } from "../../interfaces/models/cv.interface";
import { IJob } from "../../interfaces/models/job.interface";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { ILocation } from "../../interfaces/models/location.interface";

export interface CandidateCVItemDTO {
  id: Types.ObjectId;
  jobTitle: string;
  jobSlug: string;
  companyName: string;
  companyLogo?: string;
  salaryMin?: number;
  salaryMax?: number;
  position?: string;
  workingForm?: string;
  skills: string[];
  jobLocations: string[];
  status: string;
  fileCV: string;
  appliedAt: Date;
  isExpired: boolean;
  expirationDate: Date | null;
}

export interface CandidateCVListResultDTO {
  code: string;
  message: string;
  cvList: CandidateCVItemDTO[];
  pagination: PaginationDTO;
}

export const getCandidateCVListService = async (
  candidateId: Types.ObjectId,
  page: number,
  keyword: string
): Promise<CandidateCVListResultDTO> => {
  const pageSize = paginationConfig.candidateApplicationsList || 6;
  const skip = (page - 1) * pageSize;

  const cvFind: FilterQuery<ICV> = { candidateId };

  if (keyword) {
    const [atlasCompanyIds, atlasJobIds] = await Promise.all([
      findIdsByKeyword({ model: AccountCompany, keyword, atlasPaths: ["companyName", "slug"] }).catch(() => [] as string[]),
      findIdsByKeyword({ model: Job, keyword, atlasPaths: ["title", "description", "position", "workingForm"] }).catch(() => [] as string[]),
    ]);

    const allCompanyIds = atlasCompanyIds;
    const jobsByCompany = allCompanyIds.length > 0
      ? await Job.find({ companyId: { $in: allCompanyIds } }).select("_id").lean<Pick<IJob, "_id">[]>()
      : [];

    const matchedJobIds = [
      ...new Set([
        ...atlasJobIds,
        ...jobsByCompany.map(job => job._id.toString()),
      ]),
    ];

    if (matchedJobIds.length === 0) {
      return {
        code: "success",
        message: "Success.",
        cvList: [],
        pagination: {
          totalRecord: 0,
          totalPage: 1,
          currentPage: page,
          pageSize,
        },
      };
    }
    cvFind.jobId = { $in: matchedJobIds.map(id => new Types.ObjectId(id)) };
  }

  const [totalRecord, cvList] = await Promise.all([
    CV.countDocuments(cvFind),
    CV.find(cvFind)
      .sort({ createdAt: "desc" })
      .skip(skip)
      .limit(pageSize)
      .lean<ICV[]>(),
  ]);

  if (cvList.length === 0) {
    return {
      code: "success",
      message: "Success.",
      cvList: [],
      pagination: {
        totalRecord,
        totalPage: Math.max(1, Math.ceil(totalRecord / pageSize)),
        currentPage: page,
        pageSize,
      },
    };
  }

  const jobIds = [...new Set(cvList.map(cv => cv.jobId?.toString()).filter(Boolean))];
  const jobs = await Job.find({ _id: { $in: jobIds } })
    .select("title slug companyId locations salaryMin salaryMax position workingForm skills expirationDate")
    .lean<IJob[]>();
  const jobMap = new Map(jobs.map(j => [j._id.toString(), j]));

  const companyIds = [...new Set(jobs.map(j => j.companyId?.toString()).filter(Boolean))];
  const companies = await AccountCompany.find({ _id: { $in: companyIds } })
    .select("companyName logo")
    .lean<IAccountCompany[]>();
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

  const allLocationIds = [...new Set(
    jobs.flatMap(j => (j.locations || []))
      .map(id => id?.toString?.() || String(id))
      .filter(id => typeof id === "string" && /^[a-f\d]{24}$/i.test(id))
  )];
  const locations = allLocationIds.length > 0
    ? await Location.find({ _id: { $in: allLocationIds } }).select("name").lean<Pick<ILocation, "_id" | "name">[]>()
    : [];
  const locationMap = new Map(locations.map(c => [c._id.toString(), c.name]));

  const dataFinal: CandidateCVItemDTO[] = [];
  for (const item of cvList) {
    const jobInfo = jobMap.get(item.jobId?.toString() || "");
    const companyInfo = jobInfo ? companyMap.get(jobInfo.companyId?.toString() || "") : null;

    if (jobInfo && companyInfo) {
      const jobLocationNames = (jobInfo.locations || [])
        .map(locationId => locationMap.get(locationId?.toString?.() || String(locationId)))
        .filter((name): name is string => Boolean(name));

      const isExpired = jobInfo.expirationDate ? new Date(jobInfo.expirationDate) < new Date() : false;
      const itemFinal: CandidateCVItemDTO = {
        id: item._id,
        jobTitle: jobInfo.title,
        jobSlug: jobInfo.slug,
        companyName: companyInfo.companyName,
        companyLogo: companyInfo.logo,
        salaryMin: jobInfo.salaryMin,
        salaryMax: jobInfo.salaryMax,
        position: jobInfo.position,
        workingForm: jobInfo.workingForm,
        skills: jobInfo.skills || [],
        jobLocations: jobLocationNames,
        status: item.status,
        fileCV: item.fileCV,
        appliedAt: item.createdAt,
        isExpired,
        expirationDate: jobInfo.expirationDate || null,
      };
      dataFinal.push(itemFinal);
    }
  }

  return {
    code: "success",
    message: "Success.",
    cvList: dataFinal,
    pagination: buildPagination(totalRecord, page, pageSize),
  };
};

export const getCandidateCVDetailService = async (
  cvId: string,
  candidateId: Types.ObjectId
): Promise<{ status: number; code: string; message: string; cvDetail?: unknown }> => {
  if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  const cvInfo = await CV.findOne({
    _id: cvId,
    candidateId,
  }).select("fullName email phone fileCV status jobId createdAt").lean<ICV>();

  if (!cvInfo) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  const jobInfo = await Job.findOne({
    _id: cvInfo.jobId,
  }).select("title slug companyId expirationDate").lean<IJob>();

  const isExpired = jobInfo?.expirationDate ? new Date(jobInfo.expirationDate) < new Date() : false;

  const cvDetail = {
    id: cvInfo._id.toString(),
    fullName: cvInfo.fullName,
    email: cvInfo.email,
    phone: cvInfo.phone,
    fileCV: cvInfo.fileCV,
    status: cvInfo.status,
    jobTitle: jobInfo?.title || "",
    jobSlug: jobInfo?.slug || "",
    isExpired,
    expirationDate: jobInfo?.expirationDate || null,
  };

  return {
    status: 200,
    code: "success",
    message: "Success.",
    cvDetail,
  };
};

export const updateCandidateCVService = async (
  cvId: string,
  candidateId: Types.ObjectId,
  data: { fullName?: string; phone?: string },
  file?: { path: string }
): Promise<{ status: number; code: string; message: string }> => {
  const cleanupFile = () => {
    if (file) void deleteImage(file.path).catch(() => {});
  };

  if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
    cleanupFile();
    return { status: 400, code: "error", message: "Invalid CV ID." };
  }

  const cvInfo = await CV.findOne({ _id: cvId, candidateId }).select("status fileCV jobId").lean<ICV>();
  if (!cvInfo) {
    cleanupFile();
    return { status: 404, code: "error", message: "CV not found." };
  }

  if (cvInfo.status !== "initial") {
    cleanupFile();
    return { status: 409, code: "error", message: "Cannot edit application after it has been reviewed by the company." };
  }

  const jobInfo = await Job.findOne({ _id: cvInfo.jobId }).select("expirationDate").lean<IJob>();
  if (jobInfo?.expirationDate && new Date(jobInfo.expirationDate) < new Date()) {
    cleanupFile();
    return { status: 410, code: "error", message: "Cannot edit application after the job has expired." };
  }

  if (data.phone) {
    const phoneRegex = /^(84|0[35789])[0-9]{8}$/;
    if (!phoneRegex.test(data.phone)) {
      cleanupFile();
      return { status: 400, code: "error", message: "Invalid phone number! Please use Vietnamese format (e.g., 0912345678)" };
    }
  }

  const updateData: Partial<ICV> = {};
  if (data.fullName) updateData.fullName = data.fullName;
  if (data.phone) updateData.phone = data.phone;
  if (file) updateData.fileCV = file.path;

  try {
    await CV.updateOne({ _id: cvId }, updateData);

    if (file && cvInfo.fileCV) {
      void deleteImage(cvInfo.fileCV).catch((err) => console.error("[Cloudinary] Failed to delete:", err));
    }

    return { status: 200, code: "success", message: "CV updated successfully." };
  } catch (error: unknown) {
    cleanupFile();
    throw error;
  }
};

export const deleteCandidateCVService = async (
  cvId: string,
  candidateId: Types.ObjectId
): Promise<{ status: number; code: string; message: string }> => {
  if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
    return { status: 400, code: "error", message: "Invalid CV ID." };
  }

  const cvInfo = await CV.findOne({ _id: cvId, candidateId }).select("fileCV status jobId").lean<ICV>();
  if (!cvInfo) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  await Job.updateOne(
    { _id: cvInfo.jobId, applicationCount: { $gt: 0 } },
    { $inc: { applicationCount: -1 } }
  );
  if (cvInfo.status === "approved") {
    await Job.updateOne(
      { _id: cvInfo.jobId, approvedCount: { $gt: 0 } },
      { $inc: { approvedCount: -1 } }
    );
  }

  if (cvInfo.fileCV) {
    void deleteImage(cvInfo.fileCV).catch((err) => console.error("[Cloudinary] Failed to delete:", err));
  }

  await CV.deleteOne({ _id: cvId });
  await invalidateJobDiscoveryCaches();

  return { status: 200, code: "success", message: "CV deleted successfully." };
};
