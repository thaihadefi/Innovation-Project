import { Types } from "mongoose";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import Location from "../models/location.model";
import CV from "../models/cv.model";
import AccountCandidate from "../models/account-candidate.model";
import Notification from "../models/notification.model";
import cache, { CACHE_TTL } from "../helpers/cache.helper";
import { notifyCompany } from "../helpers/socket.helper";
import { deleteImage } from "../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches } from "../helpers/cache-invalidation.helper";
import { sendEmail } from "../helpers/mail.helper";
import { emailTemplates } from "../helpers/email-template.helper";
import { recordJobView } from "../helpers/job-view.helper";
import { discoveryConfig } from "../config/variable";
import { IJob } from "../interfaces/models/job.interface";
import { IAccountCompany } from "../interfaces/models/account-company.interface";
import { ILocation } from "../interfaces/models/location.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";

export interface SkillItemDTO {
  name: string;
  slug: string;
}

export interface SkillCountDTO {
  slug: string;
  count: number;
}

export interface SkillsResponseDTO {
  code: string;
  skills: string[];
  skillsWithSlug: SkillItemDTO[];
  topSkills: SkillCountDTO[];
}

export interface JobDetailDTO {
  id: string;
  title: string;
  slug: string;
  companyName: string;
  companySlug?: string;
  salaryMin?: number;
  salaryMax?: number;
  images: string[];
  position?: string;
  workingForm?: string;
  companyLocation: string;
  companyLocationSlug: string;
  jobLocations: string[];
  address?: string;
  skills: string[];
  description?: string;
  companyLogo?: string;
  companyId: string;
  companyModel?: string;
  companyEmployees?: string;
  workingTime?: string;
  workOverTime?: string;
  isFull: boolean;
  isExpired: boolean;
  expirationDate: Date | null;
  maxApplications: number;
  maxApproved: number;
  applicationCount: number;
  approvedCount: number;
}

export interface ApplyJobBodyDTO {
  jobId?: string;
  fullName?: string;
  phone?: string;
}

export interface ApplyJobInputDTO {
  jobId: string;
  fullName: string;
  phone: string;
  candidate: IAccountCandidate;
  file?: {
    path: string;
  };
}

export const getJobSkills = async (): Promise<SkillsResponseDTO> => {
  const cacheKey = "job_skills";
  const cached = (await cache.getAsync(cacheKey)) as SkillsResponseDTO | undefined;
  if (cached) {
    return cached;
  }

  const allJobs = await Job.find({
    $or: [
      { expirationDate: null },
      { expirationDate: { $exists: false } },
      { expirationDate: { $gt: new Date() } }
    ]
  })
    .select("skills")
    .lean<Pick<IJob, "skills">[]>();

  const techCount: Record<string, number> = {};

  allJobs.forEach(job => {
    if (Array.isArray(job.skills)) {
      job.skills.forEach(slug => {
        if (!slug) return;
        techCount[slug] = (techCount[slug] || 0) + 1;
      });
    }
  });

  const skillsWithCount: SkillCountDTO[] = Object.entries(techCount)
    .map(([slug, count]) => ({ slug, count }))
    .sort((a, b) => b.count !== a.count ? b.count - a.count : a.slug.localeCompare(b.slug));

  const allSkills = skillsWithCount.map(item => item.slug);
  const skillsWithSlug: SkillItemDTO[] = skillsWithCount.map(item => ({ name: item.slug, slug: item.slug }));

  const response: SkillsResponseDTO = {
    code: "success",
    skills: allSkills,
    skillsWithSlug,
    topSkills: skillsWithCount.slice(0, discoveryConfig.topSkills)
  };

  cache.set(cacheKey, response, CACHE_TTL.STATIC);
  return response;
};

export const getJobDetailBySlug = async (
  slug: string,
  viewerId?: string | null,
  clientIp?: string
): Promise<{ found: boolean; jobDetail?: JobDetailDTO }> => {
  const jobInfo = await Job.findOne({ slug })
    .select("companyId title slug salaryMin salaryMax position workingForm skills locations description images maxApplications maxApproved applicationCount approvedCount viewCount expirationDate")
    .lean<IJob>();

  if (!jobInfo) {
    return { found: false };
  }

  const isOwnerViewing = viewerId && viewerId === jobInfo.companyId?.toString();
  if (!isOwnerViewing) {
    void recordJobView(jobInfo._id, viewerId, clientIp);
  }

  const validCityIds = (jobInfo.locations || [])
    .map(id => id?.toString?.() || String(id))
    .filter(id => typeof id === "string" && /^[a-f\d]{24}$/i.test(id));

  const [companyInfo, jobLocations] = await Promise.all([
    AccountCompany.findOne({ _id: jobInfo.companyId })
      .select("companyName slug logo location address companyModel companyEmployees workingTime workOverTime status")
      .lean<IAccountCompany>(),
    validCityIds.length > 0
      ? Location.find({ _id: { $in: validCityIds } }).select("name slug").lean<ILocation[]>()
      : Promise.resolve([])
  ]);

  if (!companyInfo || companyInfo.status !== "active") {
    return { found: false };
  }

  const locationInfo = companyInfo.location
    ? await Location.findOne({ _id: companyInfo.location }).select("name slug").lean<ILocation>()
    : null;

  const jobCityNames = jobLocations.map(c => c.name);

  const maxApproved = jobInfo.maxApproved || 0;
  const approvedCount = jobInfo.approvedCount || 0;
  const isFull = maxApproved > 0 && approvedCount >= maxApproved;

  const isExpired = jobInfo.expirationDate
    ? new Date(jobInfo.expirationDate) < new Date()
    : false;

  const jobDetail: JobDetailDTO = {
    id: jobInfo._id.toString(),
    title: jobInfo.title,
    slug: jobInfo.slug,
    companyName: companyInfo.companyName,
    companySlug: companyInfo.slug,
    salaryMin: jobInfo.salaryMin,
    salaryMax: jobInfo.salaryMax,
    images: Array.from(new Set(jobInfo.images || [])),
    position: jobInfo.position,
    workingForm: jobInfo.workingForm,
    companyLocation: locationInfo?.name || "",
    companyLocationSlug: locationInfo?.slug || "",
    jobLocations: jobCityNames,
    address: companyInfo.address,
    skills: jobInfo.skills || [],
    description: jobInfo.description,
    companyLogo: companyInfo.logo,
    companyId: companyInfo._id.toString(),
    companyModel: companyInfo.companyModel,
    companyEmployees: companyInfo.companyEmployees,
    workingTime: companyInfo.workingTime,
    workOverTime: companyInfo.workOverTime,
    isFull,
    isExpired,
    expirationDate: jobInfo.expirationDate || null,
    maxApplications: jobInfo.maxApplications || 0,
    maxApproved,
    applicationCount: jobInfo.applicationCount || 0,
    approvedCount
  };

  return { found: true, jobDetail };
};

const dispatchPostApplyNotifications = async (
  job: Pick<IJob, "_id" | "title" | "slug" | "companyId" | "maxApplications" | "applicationCount">,
  fullName: string,
  cvId: Types.ObjectId
): Promise<void> => {
  try {
    const newNotif = await Notification.create({
      companyId: job.companyId,
      type: "application_received",
      title: "New Application!",
      message: `${fullName} applied for ${job.title}`,
      link: `/company-manage/cv/detail/${cvId.toString()}`,
      read: false,
      data: {
        jobId: job._id,
        jobTitle: job.title,
        cvId,
        applicantName: fullName
      }
    });

    if (job.companyId) {
      notifyCompany(job.companyId.toString(), newNotif);
    }

    const updatedJob = await Job.findById(job._id)
      .select("maxApplications applicationCount title slug companyId")
      .lean<IJob>();
    if (updatedJob && updatedJob.maxApplications > 0 && (updatedJob.applicationCount || 0) >= updatedJob.maxApplications) {
      const limitNotif = await Notification.create({
        companyId: job.companyId,
        type: "applications_limit_reached",
        title: "Application Limit Reached!",
        message: `Your job "${job.title}" has reached the maximum number of applications (${updatedJob.maxApplications}). Consider closing the job or increasing the limit.`,
        link: `/company-manage/job/edit/${job.slug}`,
        read: false,
        data: {
          jobId: job._id,
          jobTitle: job.title,
          jobSlug: job.slug
        }
      });

      if (job.companyId) {
        notifyCompany(job.companyId.toString(), limitNotif);
      }
    }

    const company = await AccountCompany.findById(job.companyId).select("email").lean<IAccountCompany>();
    if (company?.email) {
      const { subject, html } = emailTemplates.newApplicationReceived(job.title, fullName, cvId.toString());
      void sendEmail(company.email, subject, html).catch(() => {});
    }
  } catch (err) {
    console.log("[Job] Failed to send post-apply notifications:", err);
  }
};

export const applyJobService = async (
  input: ApplyJobInputDTO
): Promise<{ status: number; code: string; message: string }> => {
  const { jobId, fullName, phone, candidate, file } = input;

  const cleanupFile = () => {
    if (file?.path) void deleteImage(file.path).catch(() => {});
  };

  if (!candidate.isVerified) {
    cleanupFile();
    return {
      status: 403,
      code: "error",
      message: "Only verified UIT students and alumni can apply for jobs. Please update your MSSV in your profile."
    };
  }

  const phoneRegex = /^(84|0[35789])[0-9]{8}$/;
  if (!phoneRegex.test(phone)) {
    cleanupFile();
    return {
      status: 400,
      code: "error",
      message: "Invalid phone number! Please use Vietnamese format (e.g., 0912345678)"
    };
  }

  if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
    cleanupFile();
    return { status: 400, code: "error", message: "Invalid job ID." };
  }

  const job = await Job.findById(jobId)
    .select("maxApplications applicationCount maxApproved approvedCount expirationDate companyId title slug")
    .lean<IJob>();

  if (!job) {
    cleanupFile();
    return { status: 404, code: "error", message: "Job not found." };
  }

  if (job.maxApplications && job.maxApplications > 0 && (job.applicationCount || 0) >= job.maxApplications) {
    cleanupFile();
    return { status: 409, code: "error", message: "This position has reached maximum applications." };
  }

  if (job.maxApproved && job.maxApproved > 0 && (job.approvedCount || 0) >= job.maxApproved) {
    cleanupFile();
    return { status: 409, code: "error", message: "This position is no longer accepting applications." };
  }

  if (job.expirationDate && new Date(job.expirationDate) < new Date()) {
    cleanupFile();
    return { status: 410, code: "error", message: "This job posting has expired." };
  }

  const existCV = await CV.findOne({
    jobId: new Types.ObjectId(jobId),
    candidateId: candidate._id
  })
    .select("_id")
    .lean();

  if (existCV) {
    cleanupFile();
    return { status: 409, code: "error", message: "You have already applied for this job." };
  }

  const now = new Date();
  const reserveResult = await Job.updateOne(
    {
      _id: jobId,
      $and: [
        {
          $or: [
            { expirationDate: null },
            { expirationDate: { $exists: false } },
            { expirationDate: { $gt: now } }
          ]
        },
        {
          $or: [
            { maxApplications: { $exists: false } },
            { maxApplications: 0 },
            { $expr: { $lt: ["$applicationCount", "$maxApplications"] } }
          ]
        },
        {
          $or: [
            { maxApproved: { $exists: false } },
            { maxApproved: 0 },
            { $expr: { $lt: ["$approvedCount", "$maxApproved"] } }
          ]
        }
      ]
    },
    { $inc: { applicationCount: 1 } }
  );

  if (reserveResult.matchedCount === 0) {
    cleanupFile();
    return { status: 409, code: "error", message: "This position is no longer accepting applications." };
  }

  if (!file) {
    await Job.updateOne({ _id: jobId }, { $inc: { applicationCount: -1 } });
    return { status: 400, code: "error", message: "CV file is required." };
  }

  const newRecord = new CV({
    jobId: new Types.ObjectId(jobId),
    candidateId: candidate._id,
    fullName,
    email: candidate.email,
    phone,
    fileCV: file.path
  });

  try {
    await newRecord.save();
  } catch (error: unknown) {
    await Job.updateOne({ _id: jobId }, { $inc: { applicationCount: -1 } });
    void deleteImage(file.path).catch((e) => console.error("[Cloudinary] Failed to delete orphaned CV:", e));
    const err = error as { code?: number };
    if (err && err.code === 11000) {
      return { status: 409, code: "error", message: "You have already applied for this job." };
    }
    throw error;
  }

  await invalidateJobDiscoveryCaches();

  void dispatchPostApplyNotifications(job, fullName, newRecord._id);

  return {
    status: 200,
    code: "success",
    message: "CV submitted successfully."
  };
};

export const checkJobAppliedStatus = async (
  jobId: string,
  accountType?: "candidate" | "company" | "guest",
  accountId?: string
): Promise<{ code: string; applied: boolean; applicationId?: string | null; applicationStatus?: string | null; isVerified?: boolean }> => {
  if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
    return { code: "error", applied: false };
  }

  if (accountType === "company" && accountId) {
    const jobInfo = await Job.findOne({ _id: jobId }).select("companyId").lean<Pick<IJob, "companyId">>();
    if (jobInfo && jobInfo.companyId?.toString() === accountId) {
      return { code: "company", applied: false };
    }
    return { code: "company_other", applied: false };
  }

  if (accountType === "guest" || !accountId) {
    return { code: "guest", applied: false };
  }

  const [existCV, candidate] = await Promise.all([
    CV.findOne({ jobId: new Types.ObjectId(jobId), candidateId: new Types.ObjectId(accountId) })
      .select("_id status")
      .lean(),
    AccountCandidate.findById(accountId).select("isVerified").lean<IAccountCandidate>()
  ]);

  return {
    code: "success",
    applied: !!existCV,
    applicationId: existCV ? existCV._id.toString() : null,
    applicationStatus: existCV ? existCV.status : null,
    isVerified: candidate?.isVerified || false
  };
};
