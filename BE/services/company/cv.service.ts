import { FilterQuery, Types } from "mongoose";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import AccountCompany from "../../models/account-company.model";
import AccountCandidate from "../../models/account-candidate.model";
import Notification from "../../models/notification.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { notifyCandidate } from "../../helpers/socket.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { paginationConfig } from "../../config/variable";
import { findIdsByKeyword } from "../../helpers/atlas-search.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { ICV } from "../../interfaces/models/cv.interface";
import { IJob } from "../../interfaces/models/job.interface";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";

export interface CompanyCVListItemDTO {
  id: Types.ObjectId;
  jobTitle: string;
  fullName: string;
  email: string;
  phone?: string;
  salaryMin?: number;
  salaryMax?: number;
  position?: string;
  workingForm?: string;
  status: string;
}

export const getCompanyCVListService = async (
  companyId: Types.ObjectId,
  page: number,
  keyword?: string
): Promise<{
  code: string;
  message: string;
  cvList: CompanyCVListItemDTO[];
  pagination: PaginationDTO;
}> => {
  const pageSize = paginationConfig.companyCVList || 6;
  const skip = (page - 1) * pageSize;

  const jobFind: FilterQuery<IJob> = { companyId };
  let matchedJobIds: string[] = [];
  if (keyword) {
    const atlasJobIds = await findIdsByKeyword({
      model: Job,
      keyword,
      atlasPaths: ["title", "description", "position", "workingForm"],
      atlasMatch: { companyId } as Record<string, unknown>,
    }).catch(() => [] as string[]);
    matchedJobIds = atlasJobIds;
  }

  const jobList = await Job.find(jobFind).select("_id title salaryMin salaryMax position workingForm").lean<IJob[]>();
  const jobListId = jobList.map(item => item._id);

  if (jobListId.length === 0) {
    return {
      code: "success",
      message: "Success.",
      cvList: [],
      pagination: buildPagination(0, page, pageSize),
    };
  }

  const bannedCandidates = await AccountCandidate.find({ status: "inactive" }).select("email").lean<Pick<IAccountCandidate, "email">[]>();
  const bannedEmails = bannedCandidates.map(c => c.email);

  const cvFind: FilterQuery<ICV> = {
    jobId: { $in: jobListId },
    ...(bannedEmails.length > 0 ? { email: { $nin: bannedEmails } } : {}),
  };

  if (keyword) {
    const atlasCvIds = await findIdsByKeyword({
      model: CV,
      keyword,
      atlasPaths: ["fullName", "email"],
      atlasMatch: { jobId: { $in: jobListId } } as Record<string, unknown>,
    }).catch(() => [] as string[]);

    const matchedCvIdsByJob = matchedJobIds.length > 0
      ? await CV.find({ jobId: { $in: matchedJobIds.map(id => new Types.ObjectId(id)) } }).select("_id").lean<Pick<ICV, "_id">[]>()
      : [];

    const matchedCvIds = [
      ...new Set([
        ...atlasCvIds,
        ...matchedCvIdsByJob.map(cv => cv._id.toString()),
      ])
    ];
    cvFind._id = { $in: matchedCvIds.map(id => new Types.ObjectId(id)) };
  }

  const [totalRecord, cvList] = await Promise.all([
    CV.countDocuments(cvFind),
    CV.find(cvFind)
      .sort({ createdAt: "desc" })
      .skip(skip)
      .limit(pageSize)
      .lean<ICV[]>()
  ]);

  const jobMap = new Map(jobList.map(j => [j._id.toString(), j]));
  const dataFinal: CompanyCVListItemDTO[] = [];

  for (const item of cvList) {
    const jobInfo = jobMap.get(item.jobId?.toString() || "");
    if (jobInfo) {
      dataFinal.push({
        id: item._id,
        jobTitle: jobInfo.title,
        fullName: item.fullName,
        email: item.email,
        phone: item.phone,
        salaryMin: jobInfo.salaryMin,
        salaryMax: jobInfo.salaryMax,
        position: jobInfo.position,
        workingForm: jobInfo.workingForm,
        status: item.status,
      });
    }
  }

  return {
    code: "success",
    message: "Success.",
    cvList: dataFinal,
    pagination: buildPagination(totalRecord, page, pageSize),
  };
};

export const getCompanyCVDetailService = async (
  cvId: string,
  companyId: Types.ObjectId
): Promise<{ status: number; code: string; message: string; cvDetail?: unknown; jobDetail?: unknown }> => {
  if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
    return { status: 400, code: "error", message: "Invalid CV ID." };
  }

  const infoCV = await CV.findOne({ _id: cvId }).select("fullName email phone fileCV status jobId createdAt").lean<ICV>();
  if (!infoCV) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  const infoJob = await Job.findOne({ _id: infoCV.jobId, companyId }).select("title slug salaryMin salaryMax position workingForm skills").lean<IJob>();
  if (!infoJob) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  const candidateInfo = await AccountCandidate.findOne({ email: infoCV.email }).select("isVerified studentId status").lean<IAccountCandidate>();
  if (candidateInfo && candidateInfo.status === "inactive") {
    return { status: 404, code: "error", message: "CV not found." };
  }

  const dataFinalCV = {
    fullName: infoCV.fullName,
    email: infoCV.email,
    phone: infoCV.phone,
    fileCV: infoCV.fileCV,
    status: infoCV.status,
    isVerified: candidateInfo?.isVerified || false,
    studentId: candidateInfo?.studentId || null,
  };

  const dataFinalJob = {
    id: infoJob._id.toString(),
    slug: infoJob.slug,
    title: infoJob.title,
    salaryMin: infoJob.salaryMin,
    salaryMax: infoJob.salaryMax,
    position: infoJob.position,
    workingForm: infoJob.workingForm,
    skills: infoJob.skills || [],
  };

  if (infoCV.status === "initial") {
    await CV.updateOne({ _id: cvId }, { status: "viewed" });

    try {
      if (candidateInfo) {
        const company = await AccountCompany.findById(companyId).select("companyName").lean<IAccountCompany>();
        const viewNotif = await Notification.create({
          candidateId: candidateInfo._id,
          type: "application_viewed",
          title: "CV Viewed!",
          message: `${company?.companyName || "A company"} has viewed your application for ${infoJob.title}`,
          link: `/candidate-manage/cv/list`,
          read: false,
          data: {
            jobId: infoJob._id,
            jobTitle: infoJob.title,
            cvId: infoCV._id,
            companyName: company?.companyName
          }
        });
        notifyCandidate(candidateInfo._id.toString(), viewNotif);
      }
    } catch {
    }
  }

  return {
    status: 200,
    code: "success",
    message: "Success.",
    cvDetail: dataFinalCV,
    jobDetail: dataFinalJob
  };
};

export const changeStatusCompanyCVService = async (
  cvId: string,
  companyId: Types.ObjectId,
  status: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
    return { status: 400, code: "error", message: "Invalid CV ID." };
  }

  const allowedStatuses = ["viewed", "approved", "rejected"];
  if (!status || !allowedStatuses.includes(status)) {
    return { status: 400, code: "error", message: "Invalid status value." };
  }

  const infoCV = await CV.findOne({ _id: cvId }).select("jobId email status").lean<ICV>();
  if (!infoCV) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  const infoJob = await Job.findOne({ _id: infoCV.jobId, companyId }).select("title maxApproved approvedCount").lean<IJob>();
  if (!infoJob) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  const oldStatus = infoCV.status;
  const newStatus = status as "viewed" | "approved" | "rejected";

  const validTransitions: Record<string, string[]> = {
    initial: ["viewed"],
    viewed: ["approved", "rejected"],
    approved: ["rejected"],
    rejected: ["approved"],
  };
  const allowed = validTransitions[oldStatus] ?? [];
  if (oldStatus !== newStatus && !allowed.includes(newStatus)) {
    return {
      status: 422,
      code: "error",
      message: `Cannot transition CV status from "${oldStatus}" to "${newStatus}".`
    };
  }

  if (oldStatus !== newStatus) {
    if (newStatus === "approved" && oldStatus !== "approved") {
      const approveResult = await Job.updateOne(
        {
          _id: infoCV.jobId,
          $or: [
            { maxApproved: { $exists: false } },
            { maxApproved: 0 },
            { $expr: { $lt: ["$approvedCount", "$maxApproved"] } }
          ]
        },
        { $inc: { approvedCount: 1 } }
      );

      if (approveResult.matchedCount === 0) {
        return { status: 409, code: "error", message: "Maximum approved candidates reached." };
      }

      const cvUpdate = await CV.updateOne(
        { _id: cvId, status: oldStatus },
        { status: newStatus }
      );
      if (cvUpdate.matchedCount === 0) {
        await Job.updateOne({ _id: infoCV.jobId }, { $inc: { approvedCount: -1 } });
        return { status: 500, code: "error", message: "CV status update failed." };
      }
    } else if (oldStatus === "approved" && newStatus !== "approved") {
      const cvUpdate = await CV.updateOne(
        { _id: cvId, status: oldStatus },
        { status: newStatus }
      );
      if (cvUpdate.matchedCount === 0) {
        return { status: 500, code: "error", message: "CV status update failed." };
      }
      await Job.updateOne({ _id: infoCV.jobId }, { $inc: { approvedCount: -1 } });
    } else {
      await CV.updateOne({ _id: cvId, status: oldStatus }, { status: newStatus });
    }
  }

  await invalidateJobDiscoveryCaches();

  if (oldStatus !== newStatus && (newStatus === "approved" || newStatus === "rejected")) {
    try {
      const candidate = await AccountCandidate.findOne({ email: infoCV.email }).select("_id").lean<Pick<IAccountCandidate, "_id">>();
      if (candidate) {
        const company = await AccountCompany.findById(companyId).select("companyName").lean<IAccountCompany>();
        const notifType = newStatus === "approved" ? "application_approved" : "application_rejected";
        const notifTitle = newStatus === "approved" ? "Application Approved!" : "Application Update";
        const notifMessage = newStatus === "approved"
          ? `Congratulations! Your application for ${infoJob.title} at ${company?.companyName || "the company"} has been approved!`
          : `Your application for ${infoJob.title} at ${company?.companyName || "the company"} was not selected.`;

        const statusNotif = await Notification.create({
          candidateId: candidate._id,
          type: notifType,
          title: notifTitle,
          message: notifMessage,
          link: `/candidate-manage/cv/view/${infoCV._id.toString()}`,
          read: false,
          data: {
            jobId: infoJob._id,
            jobTitle: infoJob.title,
            cvId: infoCV._id,
            companyName: company?.companyName
          }
        });

        notifyCandidate(candidate._id.toString(), statusNotif);

        const jobTitle = infoJob.title || "the position";
        const companyNameStr = company?.companyName || "the company";
        const { subject: emailSubject, html: emailHtml } = newStatus === "approved"
          ? emailTemplates.cvApproved(jobTitle, companyNameStr)
          : emailTemplates.cvRejected(jobTitle, companyNameStr);
        if (infoCV.email) {
          void sendEmail(infoCV.email, emailSubject, emailHtml).catch(() => {});
        }
      }
    } catch {
    }
  }

  return { status: 200, code: "success", message: "Status changed." };
};

export const deleteCompanyCVService = async (
  cvId: string,
  companyId: Types.ObjectId
): Promise<{ status: number; code: string; message: string }> => {
  if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
    return { status: 400, code: "error", message: "Invalid CV ID." };
  }

  const infoCV = await CV.findOne({ _id: cvId }).select("jobId status fileCV").lean<ICV>();
  if (!infoCV) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  const infoJob = await Job.findOne({ _id: infoCV.jobId, companyId }).select("_id").lean();
  if (!infoJob) {
    return { status: 404, code: "error", message: "CV not found." };
  }

  await Job.updateOne(
    { _id: infoCV.jobId, applicationCount: { $gt: 0 } },
    { $inc: { applicationCount: -1 } }
  );
  if (infoCV.status === "approved") {
    await Job.updateOne(
      { _id: infoCV.jobId, approvedCount: { $gt: 0 } },
      { $inc: { approvedCount: -1 } }
    );
  }

  if (infoCV.fileCV) {
    void deleteImage(infoCV.fileCV).catch((err) => console.error("[Cloudinary] Failed to delete:", err));
  }

  await CV.deleteOne({ _id: cvId });
  await invalidateJobDiscoveryCaches();

  return { status: 200, code: "success", message: "CV deleted." };
};
