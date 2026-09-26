import { FilterQuery, Types } from "mongoose";
import InterviewExperience from "../models/interview-experience.model";
import ExperienceComment from "../models/experience-comment.model";
import Report from "../models/report.model";
import Notification from "../models/notification.model";
import { sanitizeRichText } from "../helpers/sanitize-rich-text.helper";
import { notifyCandidate } from "../helpers/socket.helper";
import { invalidateExperienceCaches } from "../helpers/cache-invalidation.helper";
import { getBannedCandidateIds } from "../helpers/banned-candidates.helper";
import { paginationConfig } from "../config/variable";
import { buildPagination, PaginationDTO } from "../helpers/pagination.helper";
import { buildRegexFilter } from "../helpers/query.helper";
import { notifyAdminsWithPermissions } from "../helpers/admin-notification.helper";
import { IInterviewExperience } from "../interfaces/models/interview-experience.interface";
import { IExperienceComment } from "../interfaces/models/experience-comment.interface";

export interface CreateExperienceBodyDTO {
  title?: string;
  content?: string;
  companyName?: string;
  position?: string;
  result?: "passed" | "failed" | "pending";
  difficulty?: "easy" | "medium" | "hard";
  isAnonymous?: boolean;
}

export interface UpdateExperienceBodyDTO {
  title?: string;
  content?: string;
  companyName?: string;
  position?: string;
  result?: "passed" | "failed" | "pending";
  difficulty?: "easy" | "medium" | "hard";
}

export interface CreateCommentBodyDTO {
  content?: string;
  isAnonymous?: boolean;
  parentId?: string;
}

export interface UpdateCommentBodyDTO {
  content?: string;
}

export interface ReportItemBodyDTO {
  reason?: string;
}

export interface ExperienceListItemDTO {
  _id: Types.ObjectId;
  title: string;
  companyName: string;
  position: string;
  result: "passed" | "failed" | "pending";
  difficulty: "easy" | "medium" | "hard";
  authorName: string;
  isAnonymous: boolean;
  helpfulCount: number;
  commentCount: number;
  createdAt: Date;
}

export interface ExperienceListResultDTO {
  code: string;
  posts: ExperienceListItemDTO[];
  pagination: PaginationDTO;
}

export const getExperienceListService = async (
  page: number,
  keyword: string,
  result?: string,
  difficulty?: string
): Promise<ExperienceListResultDTO> => {
  const pageSize = paginationConfig.experiencesList;
  const filter: FilterQuery<IInterviewExperience> = { status: "approved", deleted: false };

  const bannedIds = await getBannedCandidateIds();
  if (bannedIds.length > 0) {
    filter.authorId = { $nin: bannedIds.map(id => new Types.ObjectId(id)) };
  }

  const regexFilter = buildRegexFilter<IInterviewExperience>(["title", "companyName", "position"], keyword);
  if (regexFilter.$or) {
    filter.$or = regexFilter.$or;
  }

  if (result && ["passed", "failed", "pending"].includes(result)) {
    filter.result = result;
  }

  if (difficulty && ["easy", "medium", "hard"].includes(difficulty)) {
    filter.difficulty = difficulty;
  }

  const skip = (page - 1) * pageSize;
  const [total, posts] = await Promise.all([
    InterviewExperience.countDocuments(filter),
    InterviewExperience.find(filter)
      .select("title companyName position result difficulty authorName isAnonymous helpfulCount commentCount createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<ExperienceListItemDTO[]>(),
  ]);

  return {
    code: "success",
    posts,
    pagination: buildPagination(total, page, pageSize),
  };
};

export const getExperienceDetailService = async (
  id: string,
  candidateId?: Types.ObjectId
): Promise<{ status: number; code: string; found: boolean; message?: string; post?: unknown }> => {
  const bannedIds = await getBannedCandidateIds();
  const filter: FilterQuery<IInterviewExperience> = { _id: id, deleted: false };

  const post = await InterviewExperience.findOne(filter).lean<IInterviewExperience>();
  if (!post) {
    return { status: 404, code: "error", found: false, message: "Post not found." };
  }

  if (post.status !== "approved") {
    const isAuthor = candidateId && post.authorId && post.authorId.toString() === candidateId.toString();
    if (!isAuthor) {
      return { status: 404, code: "error", found: false, message: "Post not found." };
    }
  }

  if (post.authorId && bannedIds.includes(post.authorId.toString())) {
    return { status: 404, code: "error", found: false, message: "Post not found." };
  }

  const isHelpful = candidateId ? (post.helpfulVotes || []).some(v => v.toString() === candidateId.toString()) : false;

  return {
    status: 200,
    code: "success",
    found: true,
    post: {
      id: post._id,
      title: post.title,
      companyName: post.companyName,
      position: post.position,
      result: post.result,
      difficulty: post.difficulty,
      content: post.content,
      authorName: post.isAnonymous ? "Anonymous" : post.authorName,
      authorId: post.authorId,
      isAnonymous: post.isAnonymous,
      helpfulCount: post.helpfulCount || 0,
      commentCount: post.commentCount || 0,
      isHelpful,
      status: post.status,
      isEdited: post.isEdited || false,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    },
  };
};

export const createExperienceService = async (
  data: {
    authorId: Types.ObjectId;
    authorName: string;
    title: string;
    content: string;
    companyName: string;
    position: string;
    result?: "passed" | "failed" | "pending";
    difficulty?: "easy" | "medium" | "hard";
    isAnonymous?: boolean;
  }
): Promise<{ status: number; code: string; message: string }> => {
  const { title, content, companyName, position, result, difficulty, isAnonymous, authorId, authorName } = data;
  if (!title || !content || !companyName || !position || !result || !difficulty) {
    return { status: 400, code: "error", message: "All fields are required." };
  }

  const post = new InterviewExperience({
    authorId,
    authorName,
    isAnonymous: !!isAnonymous,
    title: title.trim(),
    content: sanitizeRichText(content),
    companyName: companyName.trim(),
    position: position.trim(),
    result,
    difficulty,
    status: "pending",
  });
  await post.save();

  notifyAdminsWithPermissions(["experiences_manage"], {
    title: "New Interview Experience Pending Review",
    message: `A new interview experience "${title.trim()}" has been submitted and is awaiting approval.`,
    link: "/admin-manage/interview-preparation/experiences?status=pending",
  });

  return { status: 200, code: "success", message: "Experience submitted and pending review." };
};

export const updateExperienceService = async (
  id: string,
  authorId: Types.ObjectId,
  data: {
    title?: string;
    content?: string;
    companyName?: string;
    position?: string;
    result?: "passed" | "failed" | "pending";
    difficulty?: "easy" | "medium" | "hard";
  }
): Promise<{ status: number; code: string; message: string }> => {
  const post = await InterviewExperience.findOne({ _id: id, authorId, deleted: false });
  if (!post) {
    return { status: 404, code: "error", message: "Post not found or access denied." };
  }
  const wasApproved = post.status === "approved";
  if (data.title) post.title = data.title;
  if (data.content) post.content = sanitizeRichText(data.content);
  if (data.companyName) post.companyName = data.companyName;
  if (data.position) post.position = data.position;
  if (data.result) post.result = data.result;
  if (data.difficulty) post.difficulty = data.difficulty;
  post.status = "pending";
  post.isEdited = true;
  await post.save();

  if (wasApproved) await invalidateExperienceCaches(id);
  return { status: 200, code: "success", message: "Post updated and pending re-review." };
};

export const removeExperienceService = async (
  id: string,
  authorId: Types.ObjectId
): Promise<{ status: number; code: string; message: string }> => {
  const post = await InterviewExperience.findOneAndUpdate(
    { _id: id, authorId, deleted: false },
    { $set: { deleted: true } }
  ).select("status").lean<Pick<IInterviewExperience, "status">>();

  if (!post) {
    return { status: 404, code: "error", message: "Post not found or access denied." };
  }

  const commentDocs = await ExperienceComment.find({ experienceId: new Types.ObjectId(id), deleted: false })
    .select("_id")
    .lean<Pick<IExperienceComment, "_id">[]>();
  if (commentDocs.length > 0) {
    await ExperienceComment.updateMany({ experienceId: new Types.ObjectId(id), deleted: false }, { deleted: true });
    await Report.deleteMany({ targetType: "comment", targetId: { $in: commentDocs.map(c => c._id) } });
  }

  await Report.deleteMany({ targetType: "review", targetId: new Types.ObjectId(id) });
  if (post.status === "approved") await invalidateExperienceCaches(id);

  return { status: 200, code: "success", message: "Post deleted." };
};

export const toggleExperienceHelpfulService = async (
  id: string,
  candidateId: Types.ObjectId
): Promise<{ status: number; code: string; message?: string; isHelpful?: boolean; helpfulCount?: number }> => {
  const post = await InterviewExperience.findOne({ _id: id, status: "approved", deleted: false })
    .select("authorId")
    .lean<Pick<IInterviewExperience, "authorId">>();
  if (!post) {
    return { status: 404, code: "error", message: "Post not found." };
  }
  if (post.authorId.toString() === candidateId.toString()) {
    return { status: 400, code: "error", message: "Cannot mark your own post as helpful." };
  }

  const added = await InterviewExperience.findOneAndUpdate(
    { _id: id, status: "approved", deleted: false, authorId: { $ne: candidateId }, helpfulVotes: { $ne: candidateId } },
    { $addToSet: { helpfulVotes: candidateId }, $inc: { helpfulCount: 1 } },
    { new: true, select: "helpfulCount" }
  ).lean<IInterviewExperience>();

  if (added) {
    await invalidateExperienceCaches(id);
    return { status: 200, code: "success", isHelpful: true, helpfulCount: added.helpfulCount };
  }

  const removed = await InterviewExperience.findOneAndUpdate(
    { _id: id, status: "approved", deleted: false, helpfulVotes: candidateId },
    { $pull: { helpfulVotes: candidateId }, $inc: { helpfulCount: -1 } },
    { new: true, select: "helpfulCount" }
  ).lean<IInterviewExperience>();

  if (!removed) {
    return { status: 404, code: "error", message: "Post not found." };
  }

  await invalidateExperienceCaches(id);
  return { status: 200, code: "success", isHelpful: false, helpfulCount: removed.helpfulCount };
};

export const getPostCommentsService = async (
  expId: string,
  page: number,
  candidateId?: Types.ObjectId
): Promise<{ status: number; code: string; message?: string; comments?: unknown[]; pagination?: PaginationDTO }> => {
  const bannedIds = await getBannedCandidateIds();
  const parentFilter: FilterQuery<IExperienceComment> = {
    experienceId: new Types.ObjectId(expId),
    parentId: null,
    deleted: false,
  };
  if (bannedIds.length > 0) {
    parentFilter.authorId = { $nin: bannedIds.map(id => new Types.ObjectId(id)) };
  }

  const pageSize = paginationConfig.experienceComments || 10;
  const skip = (page - 1) * pageSize;

  const [total, rootComments] = await Promise.all([
    ExperienceComment.countDocuments(parentFilter),
    ExperienceComment.find(parentFilter)
      .sort({ createdAt: 1 })
      .skip(skip)
      .limit(pageSize)
      .lean<IExperienceComment[]>(),
  ]);

  const rootIds = rootComments.map(c => c._id);
  const repliesFilter: FilterQuery<IExperienceComment> = {
    experienceId: new Types.ObjectId(expId),
    parentId: { $in: rootIds },
    deleted: false,
  };
  if (bannedIds.length > 0) {
    repliesFilter.authorId = { $nin: bannedIds.map(id => new Types.ObjectId(id)) };
  }

  const replies = await ExperienceComment.find(repliesFilter)
    .sort({ createdAt: 1 })
    .lean<IExperienceComment[]>();

  const repliesByParent = new Map<string, IExperienceComment[]>();
  for (const reply of replies) {
    const pId = reply.parentId!.toString();
    if (!repliesByParent.has(pId)) repliesByParent.set(pId, []);
    repliesByParent.get(pId)!.push(reply);
  }

  const formatComment = (c: IExperienceComment) => ({
    id: c._id,
    experienceId: c.experienceId,
    parentId: c.parentId,
    authorId: c.authorId,
    authorName: c.isAnonymous ? "Anonymous" : c.authorName,
    isAnonymous: c.isAnonymous,
    content: c.content,
    helpfulCount: c.helpfulCount || 0,
    isHelpful: candidateId ? (c.helpfulVotes || []).some(v => v.toString() === candidateId.toString()) : false,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  });

  const comments = rootComments.map(c => ({
    ...formatComment(c),
    replies: (repliesByParent.get(c._id.toString()) || []).map(formatComment),
  }));

  return {
    status: 200,
    code: "success",
    comments,
    pagination: buildPagination(total, page, pageSize),
  };
};

export const listCommentsService = getPostCommentsService;

export const createPostCommentService = async (
  expId: string,
  author: { _id: Types.ObjectId; fullName?: string },
  data: { content: string; isAnonymous?: boolean; parentId?: string }
): Promise<{ status: number; code: string; message: string; comment?: unknown }> => {
  const { content, isAnonymous, parentId } = data;
  if (!content || !content.trim()) {
    return { status: 400, code: "error", message: "Comment content is required." };
  }

  const post = await InterviewExperience.findOne({ _id: expId, status: "approved", deleted: false })
    .select("_id title authorId")
    .lean<IInterviewExperience>();
  if (!post) {
    return { status: 404, code: "error", message: "Post not found." };
  }

  if (parentId) {
    const parent = await ExperienceComment.findOne({ _id: parentId, experienceId: new Types.ObjectId(expId), deleted: false }).lean();
    if (!parent) {
      return { status: 404, code: "error", message: "Parent comment not found." };
    }
  }

  const comment = new ExperienceComment({
    experienceId: new Types.ObjectId(expId),
    parentId: parentId ? new Types.ObjectId(parentId) : null,
    authorId: author._id,
    authorName: author.fullName || "User",
    isAnonymous: !!isAnonymous,
    content: sanitizeRichText(content.trim()),
  });
  await comment.save();

  await InterviewExperience.updateOne({ _id: expId }, { $inc: { commentCount: 1 } });
  await invalidateExperienceCaches(expId);

  if (post.authorId && post.authorId.toString() !== author._id.toString()) {
    (async () => {
      try {
        const notif = await Notification.create({
          candidateId: post.authorId,
          type: "experience_comment",
          title: "New Comment on Your Post",
          message: `${isAnonymous ? "Someone" : (author.fullName || "User")} commented on your interview experience "${post.title}".`,
          link: `/candidate-manage/interview-preparation/experiences`,
          read: false,
        });
        notifyCandidate(post.authorId.toString(), notif);
      } catch {
      }
    })();
  }

  return {
    status: 200,
    code: "success",
    message: "Comment added.",
    comment: {
      id: comment._id,
      experienceId: comment.experienceId,
      parentId: comment.parentId,
      authorId: comment.authorId,
      authorName: comment.isAnonymous ? "Anonymous" : comment.authorName,
      isAnonymous: comment.isAnonymous,
      content: comment.content,
      helpfulCount: 0,
      isHelpful: false,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      replies: [],
    },
  };
};

export const createCommentService = createPostCommentService;

export const updateCommentService = async (
  commentId: string,
  authorId: Types.ObjectId,
  content: string
): Promise<{ status: number; code: string; message: string }> => {
  if (!content || !content.trim()) {
    return { status: 400, code: "error", message: "Comment content is required." };
  }

  const comment = await ExperienceComment.findOneAndUpdate(
    { _id: commentId, authorId, deleted: false },
    { content: sanitizeRichText(content.trim()), isEdited: true }
  );

  if (!comment) {
    return { status: 404, code: "error", message: "Comment not found or access denied." };
  }

  return { status: 200, code: "success", message: "Comment updated." };
};

export const removeCommentService = async (
  commentId: string,
  authorId: Types.ObjectId
): Promise<{ status: number; code: string; message: string }> => {
  const comment = await ExperienceComment.findOne({ _id: commentId, authorId, deleted: false });
  if (!comment) {
    return { status: 404, code: "error", message: "Comment not found or access denied." };
  }

  let decrementCount = 1;
  let replyDocIds: Types.ObjectId[] = [];
  if (!comment.parentId) {
    const replies = await ExperienceComment.find({ parentId: new Types.ObjectId(commentId), deleted: false })
      .select("_id")
      .lean<Pick<IExperienceComment, "_id">[]>();
    if (replies.length > 0) {
      replyDocIds = replies.map(r => r._id);
      const res = await ExperienceComment.updateMany({ parentId: new Types.ObjectId(commentId), deleted: false }, { deleted: true });
      decrementCount += res.modifiedCount;
    }
  }

  comment.deleted = true;
  await comment.save();

  await Report.deleteMany({
    targetType: "comment",
    targetId: { $in: [comment._id, ...replyDocIds] },
  });

  await InterviewExperience.updateOne(
    { _id: comment.experienceId, commentCount: { $gte: decrementCount } },
    { $inc: { commentCount: -decrementCount } }
  );

  await invalidateExperienceCaches(comment.experienceId.toString());
  return { status: 200, code: "success", message: "Comment deleted." };
};

export const toggleCommentHelpfulService = async (
  commentId: string,
  candidateId: Types.ObjectId
): Promise<{ status: number; code: string; message?: string; isHelpful?: boolean; helpfulCount?: number }> => {
  const comment = await ExperienceComment.findOne({ _id: commentId, deleted: false })
    .select("authorId")
    .lean<Pick<IExperienceComment, "authorId">>();
  if (!comment) {
    return { status: 404, code: "error", message: "Comment not found." };
  }
  if (comment.authorId.toString() === candidateId.toString()) {
    return { status: 400, code: "error", message: "Cannot mark your own comment as helpful." };
  }

  const added = await ExperienceComment.findOneAndUpdate(
    { _id: commentId, deleted: false, authorId: { $ne: candidateId }, helpfulVotes: { $ne: candidateId } },
    { $addToSet: { helpfulVotes: candidateId }, $inc: { helpfulCount: 1 } },
    { new: true, select: "helpfulCount" }
  ).lean<IExperienceComment>();

  if (added) {
    return { status: 200, code: "success", isHelpful: true, helpfulCount: added.helpfulCount };
  }

  const removed = await ExperienceComment.findOneAndUpdate(
    { _id: commentId, deleted: false, helpfulVotes: candidateId },
    { $pull: { helpfulVotes: candidateId }, $inc: { helpfulCount: -1 } },
    { new: true, select: "helpfulCount" }
  ).lean<IExperienceComment>();

  if (!removed) {
    return { status: 404, code: "error", message: "Comment not found." };
  }

  return { status: 200, code: "success", isHelpful: false, helpfulCount: removed.helpfulCount };
};

export const reportCommentService = async (
  commentId: string,
  reporterId: Types.ObjectId,
  reporterType: "candidate" | "company",
  reason: string
): Promise<{ status: number; code: string; message: string }> => {
  const comment = await ExperienceComment.findOne({ _id: commentId, deleted: false }).select("_id content").lean<IExperienceComment>();
  if (!comment) {
    return { status: 404, code: "error", message: "Comment not found." };
  }

  const existing = await Report.findOne({ targetType: "comment", targetId: new Types.ObjectId(commentId), reporterId }).lean();
  if (existing) {
    return { status: 409, code: "error", message: "You have already reported this comment." };
  }

  await Report.create({
    targetType: "comment",
    targetId: new Types.ObjectId(commentId),
    reporterId,
    reporterType,
    reason: reason.trim(),
  });

  const snippet = comment.content.slice(0, 40);
  notifyAdminsWithPermissions(["experiences_manage", "reports_manage"], {
    title: "Comment Reported",
    message: `A comment ("${snippet}...") has been reported.`,
    link: "/admin-manage/reports",
  });

  return { status: 200, code: "success", message: "Report submitted." };
};
