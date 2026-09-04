import { FilterQuery, Types } from "mongoose";
import Job from "../../models/job.model";
import AccountCompany from "../../models/account-company.model";
import Location from "../../models/location.model";
import CV from "../../models/cv.model";
import SavedJob from "../../models/saved-job.model";
import JobView from "../../models/job-view.model";
import Notification from "../../models/notification.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { adminPaginationConfig } from "../../config/variable";
import { AUDIT_ACTIONS } from "../../config/audit-actions";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { escapeRegex } from "../../helpers/query.helper";
import { IJob } from "../../interfaces/models/job.interface";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { ILocation } from "../../interfaces/models/location.interface";
import { ICV } from "../../interfaces/models/cv.interface";

export const getAdminJobListService = async (
  page: number,
  keyword?: string,
  status?: string
): Promise<{
  code: string;
  jobs: unknown[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.jobs;
  const skip = (page - 1) * pageSize;
  const now = new Date();
  const filter: FilterQuery<IJob> = {};

  if (keyword && keyword.trim()) {
    const escaped = escapeRegex(keyword.trim());
    const matchingCompanies = await AccountCompany.find(
      { companyName: { $regex: escaped, $options: "i" } },
      { _id: 1 }
    ).lean<Pick<IAccountCompany, "_id">[]>();
    const matchingCompanyIds = matchingCompanies.map(c => c._id);

    filter.$or = [
      { title: { $regex: escaped, $options: "i" } },
      { position: { $regex: escaped, $options: "i" } },
      ...(matchingCompanyIds.length > 0 ? [{ companyId: { $in: matchingCompanyIds } }] : []),
    ];
  }

  if (status === "active") {
    filter.$and = filter.$and || [];
    filter.$and.push({ $or: [{ expirationDate: null }, { expirationDate: { $gt: now } }] });
  }
  if (status === "expired") filter.expirationDate = { $lte: now };

  const [total, jobs] = await Promise.all([
    Job.countDocuments(filter),
    Job.find(filter)
      .select("title position companyId locations salaryMin salaryMax skills expirationDate createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<IJob[]>(),
  ]);

  const companyIds = [...new Set(jobs.map(j => j.companyId.toString()))];
  const allLocationIds = [...new Set(jobs.flatMap(j => (j.locations || []).map(l => l.toString())))];

  const [companies, locations] = await Promise.all([
    AccountCompany.find({ _id: { $in: companyIds } }).select("companyName logo").lean<Pick<IAccountCompany, "_id" | "companyName" | "logo">[]>(),
    Location.find({ _id: { $in: allLocationIds } }).select("name").lean<Pick<ILocation, "_id" | "name">[]>(),
  ]);

  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));
  const locationMap = new Map(locations.map(l => [l._id.toString(), l.name]));

  const jobsWithDetails = jobs.map(j => ({
    ...j,
    company: companyMap.get(j.companyId.toString()) || { companyName: "Unknown", logo: "" },
    locationNames: (j.locations || []).map(lid => locationMap.get(lid.toString())).filter(Boolean),
  }));

  return {
    code: "success",
    jobs: jobsWithDetails,
    pagination: buildPagination(total, page, pageSize),
  };
};

export const deleteAdminJobService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string
): Promise<{ status: number; code: string; message: string }> => {
  const job = await Job.findById(id).lean<IJob>();
  if (!job) {
    return { status: 404, code: "error", message: "Job not found." };
  }

  const cvList = await CV.find({ jobId: new Types.ObjectId(id) }).select("fileCV").lean<Pick<ICV, "fileCV">[]>();
  const cvFiles = cvList.map(c => c.fileCV).filter(Boolean);

  await Promise.all([
    ...(job.images || []).map(img => deleteImage(img)),
    ...cvFiles.map(file => deleteImage(file)),
  ]);

  await Promise.all([
    Job.findByIdAndDelete(id),
    JobView.deleteMany({ jobId: new Types.ObjectId(id) }),
    CV.deleteMany({ jobId: new Types.ObjectId(id) }),
    SavedJob.deleteMany({ jobId: new Types.ObjectId(id) }),
    Notification.deleteMany({ link: { $regex: id } }),
  ]);

  await invalidateJobDiscoveryCaches();

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.JOB_DELETE,
    targetId: id,
    targetType: "Job",
    detail: { title: job.title, companyId: job.companyId.toString() },
  });

  return { status: 200, code: "success", message: "Job and associated data deleted." };
};
