import { FilterQuery, Types } from "mongoose";
import AccountCandidate from "../../models/account-candidate.model";
import CV from "../../models/cv.model";
import SavedJob from "../../models/saved-job.model";
import FollowCompany from "../../models/follow-company.model";
import Review from "../../models/review.model";
import Report from "../../models/report.model";
import Notification from "../../models/notification.model";
import InterviewExperience from "../../models/interview-experience.model";
import ExperienceComment from "../../models/experience-comment.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches, invalidateExperienceCaches } from "../../helpers/cache-invalidation.helper";
import { invalidateBannedCandidateCache } from "../../helpers/banned-candidates.helper";
import { recountJobApplications } from "../../helpers/job-recount.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { adminPaginationConfig } from "../../config/variable";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";
import { AUDIT_ACTIONS } from "../../config/audit-actions";
import { buildRegexFilter } from "../../helpers/query.helper";
import { paginateQuery, PaginationDTO } from "../../helpers/pagination.helper";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import { ICV } from "../../interfaces/models/cv.interface";
import { IReview } from "../../interfaces/models/review.interface";
import { IInterviewExperience } from "../../interfaces/models/interview-experience.interface";
import { IExperienceComment } from "../../interfaces/models/experience-comment.interface";

export const getAdminCandidateListService = async (
  page: number,
  keyword?: string,
  status?: string,
  verified?: string
): Promise<{
  code: string;
  candidates: IAccountCandidate[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.candidates;

  const filter: FilterQuery<IAccountCandidate> = {};
  if (status && ["active", "inactive"].includes(status)) filter.status = status;
  if (verified === "true") filter.isVerified = true;
  if (verified === "false") filter.isVerified = false;

  const regexFilter = buildRegexFilter(["fullName", "email", "studentId", "cohort", "major"], keyword);
  if (regexFilter.$or) {
    filter.$or = regexFilter.$or as FilterQuery<IAccountCandidate>["$or"];
  }

  const { items, pagination } = await paginateQuery(AccountCandidate, filter, {
    page,
    pageSize,
    projection: "-password",
  });

  return { code: "success", candidates: items, pagination };
};

export const setAdminCandidateVerifiedService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string,
  isVerified: boolean
): Promise<{ status: number; code: string; message: string }> => {
  const candidate = await AccountCandidate.findByIdAndUpdate(
    id,
    { isVerified },
    { new: true }
  ).select("fullName email isVerified").lean<IAccountCandidate>();

  if (!candidate) {
    return { status: 404, code: "error", message: "Candidate not found." };
  }

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: isVerified ? AUDIT_ACTIONS.CANDIDATE_VERIFY : AUDIT_ACTIONS.CANDIDATE_UNVERIFY,
    targetId: id,
    targetType: "AccountCandidate",
    detail: { email: candidate.email, isVerified },
  });

  if (isVerified && candidate.email) {
    const { subject, html } = emailTemplates.studentVerified(candidate.fullName || "Student");
    void sendEmail(candidate.email, subject, html).catch((err) => {
      console.error("[Candidate] Failed to send verification email:", err);
    });
  }

  return {
    status: 200,
    code: "success",
    message: isVerified ? "Candidate account verified." : "Candidate verification removed."
  };
};

export const setAdminCandidateStatusService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string,
  status: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!["active", "inactive"].includes(status)) {
    return { status: 400, code: "error", message: "Invalid status." };
  }

  const candidate = await AccountCandidate.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  ).select("fullName email status").lean<IAccountCandidate>();

  if (!candidate) {
    return { status: 404, code: "error", message: "Candidate not found." };
  }

  await Promise.all([
    invalidateJobDiscoveryCaches(),
    invalidateBannedCandidateCache(),
  ]);

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: status === "active" ? AUDIT_ACTIONS.CANDIDATE_UNBAN : AUDIT_ACTIONS.CANDIDATE_BAN,
    targetId: id,
    targetType: "AccountCandidate",
    detail: { email: candidate.email, status },
  });

  return {
    status: 200,
    code: "success",
    message: status === "active" ? "Candidate account activated." : "Candidate account deactivated."
  };
};

export const deleteAdminCandidateService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string
): Promise<{ status: number; code: string; message: string }> => {
  const candidate = await AccountCandidate.findById(id).lean<IAccountCandidate>();
  if (!candidate) {
    return { status: 404, code: "error", message: "Candidate not found." };
  }

  const cvList = await CV.find({ candidateId: new Types.ObjectId(id) }).select("_id fileCV jobId").lean<Pick<ICV, "_id" | "fileCV" | "jobId">[]>();
  const cvFiles = cvList.map((c) => c.fileCV).filter(Boolean);
  await Promise.all(cvFiles.map((file) => deleteImage(file)));

  const jobIdsToRecount = [...new Set(cvList.map((c) => c.jobId.toString()))];

  const reviewList = await Review.find({ candidateId: new Types.ObjectId(id) }).select("_id").lean<Pick<IReview, "_id">[]>();
  const reviewIds = reviewList.map((r) => r._id);

  const expList = await InterviewExperience.find({ authorId: new Types.ObjectId(id) }).select("_id").lean<Pick<IInterviewExperience, "_id">[]>();
  const expIds = expList.map((e) => e._id);

  const commentList = await ExperienceComment.find({ authorId: new Types.ObjectId(id) }).select("_id").lean<Pick<IExperienceComment, "_id">[]>();
  const commentIds = commentList.map((c) => c._id);

  await Promise.all([
    CV.deleteMany({ candidateId: new Types.ObjectId(id) }),
    SavedJob.deleteMany({ candidateId: new Types.ObjectId(id) }),
    FollowCompany.deleteMany({ candidateId: new Types.ObjectId(id) }),
    Review.deleteMany({ candidateId: new Types.ObjectId(id) }),
    Notification.deleteMany({ candidateId: new Types.ObjectId(id) }),
    InterviewExperience.deleteMany({ authorId: new Types.ObjectId(id) }),
    ExperienceComment.deleteMany({ authorId: new Types.ObjectId(id) }),
    Report.deleteMany({
      $or: [
        { reporterId: new Types.ObjectId(id), reporterType: "candidate" },
        ...(reviewIds.length > 0 ? [{ targetType: "review", targetId: { $in: reviewIds } }] : []),
        ...(commentIds.length > 0 ? [{ targetType: "comment", targetId: { $in: commentIds } }] : []),
      ]
    }),
  ]);

  if (candidate.avatar) {
    await deleteImage(candidate.avatar);
  }

  await AccountCandidate.findByIdAndDelete(id);

  await Promise.all([
    recountJobApplications(jobIdsToRecount),
    invalidateJobDiscoveryCaches(),
    invalidateBannedCandidateCache(),
    ...expIds.map((expId) => invalidateExperienceCaches(expId.toString())),
  ]);

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.CANDIDATE_DELETE,
    targetId: id,
    targetType: "AccountCandidate",
    detail: { email: candidate.email, fullName: candidate.fullName },
  });

  return { status: 200, code: "success", message: "Candidate account deleted." };
};
