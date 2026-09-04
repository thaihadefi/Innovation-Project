import { FilterQuery, Types } from "mongoose";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import SavedJob from "../../models/saved-job.model";
import FollowCompany from "../../models/follow-company.model";
import Review from "../../models/review.model";
import Report from "../../models/report.model";
import Notification from "../../models/notification.model";
import JobView from "../../models/job-view.model";
import InterviewExperience from "../../models/interview-experience.model";
import ExperienceComment from "../../models/experience-comment.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { adminPaginationConfig } from "../../config/variable";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";
import { AUDIT_ACTIONS } from "../../config/audit-actions";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { notifyCompany } from "../../helpers/socket.helper";
import { buildRegexFilter } from "../../helpers/query.helper";
import { paginateQuery, PaginationDTO } from "../../helpers/pagination.helper";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { IJob } from "../../interfaces/models/job.interface";
import { ICV } from "../../interfaces/models/cv.interface";
import { IReview } from "../../interfaces/models/review.interface";
import { IInterviewExperience } from "../../interfaces/models/interview-experience.interface";

export const getAdminCompanyListService = async (
  page: number,
  keyword?: string,
  status?: string
): Promise<{
  code: string;
  companies: IAccountCompany[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.companies;

  const filter: FilterQuery<IAccountCompany> = {};
  if (status && ["initial", "active", "inactive"].includes(status)) filter.status = status;

  const regexFilter = buildRegexFilter(["companyName", "email"], keyword);
  if (regexFilter.$or) {
    filter.$or = regexFilter.$or as FilterQuery<IAccountCompany>["$or"];
  }

  const { items, pagination } = await paginateQuery(AccountCompany, filter, {
    page,
    pageSize,
    projection: "companyName email phone location status slug logo createdAt",
  });

  return {
    code: "success",
    companies: items,
    pagination,
  };
};

export const setAdminCompanyStatusService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string,
  status: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!["initial", "active", "inactive"].includes(status)) {
    return { status: 400, code: "error", message: "Invalid status." };
  }

  const company = await AccountCompany.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).select("companyName email status").lean<IAccountCompany>();

  if (!company) {
    return { status: 404, code: "error", message: "Company not found." };
  }

  await invalidateJobDiscoveryCaches();

  const auditAction = status === "active" ? AUDIT_ACTIONS.COMPANY_APPROVE : (status === "inactive" ? AUDIT_ACTIONS.COMPANY_BAN : AUDIT_ACTIONS.COMPANY_STATUS_CHANGE);

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: auditAction,
    targetId: id,
    targetType: "AccountCompany",
    detail: { email: company.email, status },
  });

  if (status === "active" && company.email) {
    const { subject, html } = emailTemplates.companyApproved(company.companyName);
    void sendEmail(company.email, subject, html).catch((err) => {
      console.error("[Company] Failed to send approval email:", err);
    });

    const notif = await Notification.create({
      companyId: company._id,
      type: "other" as const,
      title: "Company Approved!",
      message: `Your company profile "${company.companyName}" has been approved. You can now post jobs.`,
      link: "/company-manage/job/create",
      read: false,
    });
    notifyCompany(company._id.toString(), notif);
  }

  const messages: Record<string, string> = {
    active: "Company activated and approved.",
    inactive: "Company deactivated.",
    initial: "Company set to pending approval.",
  };

  return { status: 200, code: "success", message: messages[status] || "Status updated." };
};

export const deleteAdminCompanyService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string
): Promise<{ status: number; code: string; message: string }> => {
  const company = await AccountCompany.findById(id).lean<IAccountCompany>();
  if (!company) {
    return { status: 404, code: "error", message: "Company not found." };
  }

  const jobList = await Job.find({ companyId: new Types.ObjectId(id) }).select("_id images").lean<Pick<IJob, "_id" | "images">[]>();
  const jobIds = jobList.map((j) => j._id);
  const jobImages = jobList.flatMap((j) => j.images || []);

  const cvList = await CV.find({ jobId: { $in: jobIds } }).select("fileCV").lean<Pick<ICV, "fileCV">[]>();
  const cvFiles = cvList.map((c) => c.fileCV).filter(Boolean);

  await Promise.all([
    ...jobImages.map((img) => deleteImage(img)),
    ...cvFiles.map((file) => deleteImage(file)),
    company.logo ? deleteImage(company.logo) : Promise.resolve(),
  ]);

  const reviewList = await Review.find({ companyId: new Types.ObjectId(id) }).select("_id").lean<Pick<IReview, "_id">[]>();
  const reviewIds = reviewList.map((r) => r._id);

  const expList = await InterviewExperience.find({ companyName: company.companyName }).select("_id").lean<Pick<IInterviewExperience, "_id">[]>();
  const expIds = expList.map((e) => e._id);

  await Promise.all([
    Job.deleteMany({ companyId: new Types.ObjectId(id) }),
    JobView.deleteMany({ jobId: { $in: jobIds } }),
    CV.deleteMany({ jobId: { $in: jobIds } }),
    SavedJob.deleteMany({ jobId: { $in: jobIds } }),
    FollowCompany.deleteMany({ companyId: new Types.ObjectId(id) }),
    Review.deleteMany({ companyId: new Types.ObjectId(id) }),
    Notification.deleteMany({ companyId: new Types.ObjectId(id) }),
    InterviewExperience.deleteMany({ companyName: company.companyName }),
    ExperienceComment.deleteMany({ experienceId: { $in: expIds } }),
    Report.deleteMany({
      $or: [
        { reporterId: new Types.ObjectId(id), reporterType: "company" },
        ...(reviewIds.length > 0 ? [{ targetType: "review", targetId: { $in: reviewIds } }] : []),
      ]
    }),
  ]);

  await AccountCompany.findByIdAndDelete(id);
  await invalidateJobDiscoveryCaches();

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.COMPANY_DELETE,
    targetId: id,
    targetType: "AccountCompany",
    detail: { email: company.email, companyName: company.companyName },
  });

  return { status: 200, code: "success", message: "Company and all associated data deleted." };
};
