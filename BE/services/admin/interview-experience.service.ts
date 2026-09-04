import { FilterQuery, Types } from "mongoose";
import InterviewExperience from "../../models/interview-experience.model";
import ExperienceComment from "../../models/experience-comment.model";
import Report from "../../models/report.model";
import Notification from "../../models/notification.model";
import { notifyCandidate } from "../../helpers/socket.helper";
import { invalidateExperienceCaches } from "../../helpers/cache-invalidation.helper";
import { adminPaginationConfig } from "../../config/variable";
import { logAdminAction } from "../../helpers/admin-audit-log.helper";
import { AUDIT_ACTIONS } from "../../config/audit-actions";
import { buildRegexFilter } from "../../helpers/query.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { IInterviewExperience } from "../../interfaces/models/interview-experience.interface";
import { IExperienceComment } from "../../interfaces/models/experience-comment.interface";

export const getAdminInterviewExperienceListService = async (
  page: number,
  keyword?: string,
  status?: string
): Promise<{
  code: string;
  posts: IInterviewExperience[];
  pagination: PaginationDTO;
}> => {
  const pageSize = adminPaginationConfig.experiences;
  const skip = (page - 1) * pageSize;

  const filter: FilterQuery<IInterviewExperience> = { deleted: false };
  if (status && ["pending", "approved", "rejected"].includes(status)) filter.status = status;

  const regexFilter = buildRegexFilter(["title", "companyName", "authorName", "position"], keyword);
  if (regexFilter.$or) {
    filter.$or = regexFilter.$or as FilterQuery<IInterviewExperience>["$or"];
  }

  const [total, posts] = await Promise.all([
    InterviewExperience.countDocuments(filter),
    InterviewExperience.find(filter)
      .select("title companyName position result difficulty authorName isAnonymous status isEdited content createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<IInterviewExperience[]>(),
  ]);

  return {
    code: "success",
    posts,
    pagination: buildPagination(total, page, pageSize),
  };
};

export const updateAdminInterviewExperienceStatusService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string,
  status: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!["approved", "rejected"].includes(status)) {
    return { status: 400, code: "error", message: "Invalid status. Must be 'approved' or 'rejected'." };
  }

  const post = await InterviewExperience.findOneAndUpdate(
    { _id: id, deleted: false },
    { status },
    { new: false }
  ).select("authorId title status").lean<IInterviewExperience>();

  if (!post) {
    return { status: 404, code: "error", message: "Post not found." };
  }

  if (post.status === status) {
    await invalidateExperienceCaches(id);
    return { status: 200, code: "success", message: status === "approved" ? "Post approved." : "Post rejected." };
  }

  if (post.authorId) {
    const notif = await Notification.create({
      candidateId: post.authorId,
      type: status === "approved" ? "experience_approved" : "experience_rejected",
      title: status === "approved" ? "Post Approved!" : "Post Not Approved",
      message: status === "approved"
        ? `Your interview experience "${post.title}" has been approved and is now visible to others.`
        : `Your interview experience "${post.title}" was not approved. You may edit and resubmit.`,
      link: "/candidate-manage/interview-preparation/experiences",
      read: false,
    });
    notifyCandidate(post.authorId.toString(), notif);
  }

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: status === "approved" ? AUDIT_ACTIONS.EXPERIENCE_APPROVE : AUDIT_ACTIONS.EXPERIENCE_REJECT,
    targetId: id,
    targetType: "InterviewExperience",
    detail: { title: post.title },
  });
  await invalidateExperienceCaches(id);

  return { status: 200, code: "success", message: status === "approved" ? "Post approved." : "Post rejected." };
};

export const removeAdminInterviewExperienceService = async (
  admin: { _id: Types.ObjectId; email: string },
  id: string
): Promise<{ status: number; code: string; message: string }> => {
  const post = await InterviewExperience.findOneAndUpdate({ _id: id, deleted: false }, { deleted: true }).select("title authorName").lean<IInterviewExperience>();
  if (!post) {
    return { status: 404, code: "error", message: "Post not found." };
  }

  const commentDocs = await ExperienceComment.find({ experienceId: new Types.ObjectId(id), deleted: false }).select("_id").lean<Pick<IExperienceComment, "_id">[]>();
  if (commentDocs.length > 0) {
    await ExperienceComment.updateMany({ experienceId: new Types.ObjectId(id), deleted: false }, { deleted: true });
    await Report.updateMany(
      { targetType: "comment", targetId: { $in: commentDocs.map(c => c._id) } },
      { status: "resolved" }
    );
  }

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.EXPERIENCE_DELETE,
    targetId: id,
    targetType: "InterviewExperience",
    detail: { title: post.title, authorName: post.authorName },
  });
  await invalidateExperienceCaches(id);

  return { status: 200, code: "success", message: "Post deleted." };
};

export const deleteAdminExperienceCommentService = async (
  admin: { _id: Types.ObjectId; email: string },
  commentId: string
): Promise<{ status: number; code: string; message: string }> => {
  const comment = await ExperienceComment.findOne({ _id: commentId, deleted: false });
  if (!comment) {
    return { status: 404, code: "error", message: "Comment not found." };
  }

  comment.deleted = true;
  await comment.save();

  let replyIds: Types.ObjectId[] = [];
  let replyCount = 0;
  if (!comment.parentId) {
    const replyDocs = await ExperienceComment.find(
      { parentId: new Types.ObjectId(commentId), deleted: false }
    ).select("_id").lean<Pick<IExperienceComment, "_id">[]>();
    replyIds = replyDocs.map(r => r._id);

    const deletedReplies = await ExperienceComment.updateMany(
      { parentId: new Types.ObjectId(commentId), deleted: false },
      { deleted: true }
    );
    replyCount = deletedReplies.modifiedCount;
  }

  const totalDecrement = 1 + replyCount;
  await InterviewExperience.updateOne(
    { _id: comment.experienceId, commentCount: { $gte: totalDecrement } },
    { $inc: { commentCount: -totalDecrement } }
  );

  const allTargetIds = [new Types.ObjectId(commentId), ...replyIds];
  await Report.updateMany(
    { targetType: "comment", targetId: { $in: allTargetIds } },
    { status: "resolved" }
  );

  logAdminAction({
    actorId: admin._id.toString(),
    actorEmail: admin.email,
    action: AUDIT_ACTIONS.EXPERIENCE_COMMENT_DELETE,
    targetId: commentId,
    targetType: "ExperienceComment",
    detail: { experienceId: comment.experienceId?.toString(), repliesDeleted: replyCount },
  });

  return { status: 200, code: "success", message: "Comment deleted." };
};
