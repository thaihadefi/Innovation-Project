import { Response } from "express";
import { parsePage } from "../helpers/pagination.helper";
import { RequestAccount } from "../interfaces/request.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { unauthorized, serverError, forbidden, notFound } from "../helpers/response.helper";
import * as expService from "../services/interview-experience.service";

export const list = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can access interview experiences.");
      return;
    }
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();
    const result = req.query.result as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;

    const payload = await expService.getExperienceListService(page, keyword, result, difficulty);
    res.json(payload);
  } catch {
    serverError(res);
  }
};

export const detail = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can access interview experiences.");
      return;
    }
    const { id } = req.params;
    const result = await expService.getExperienceDetailService(id);
    if (!result.found) {
      notFound(res, "Post not found.");
      return;
    }
    res.json({ code: "success", post: result.post });
  } catch {
    serverError(res);
  }
};

export const create = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can post interview experiences.");
      return;
    }
    const candidate = req.account as IAccountCandidate;
    const body = req.body as expService.CreateExperienceBodyDTO;

    const resData = await expService.createExperienceService({
      title: String(body.title || ""),
      content: String(body.content || ""),
      companyName: String(body.companyName || ""),
      position: String(body.position || ""),
      result: body.result,
      difficulty: body.difficulty || "medium",
      isAnonymous: body.isAnonymous,
      authorId: candidate._id,
      authorName: candidate.fullName
    });

    res.status(resData.status).json({ code: resData.code, message: resData.message });
  } catch {
    serverError(res);
  }
};

export const update = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can post interview experiences.");
      return;
    }
    const { id } = req.params;
    const candidate = req.account as IAccountCandidate;
    const body = req.body as expService.UpdateExperienceBodyDTO;

    const resData = await expService.updateExperienceService(id, candidate._id, body);
    res.status(resData.status).json({ code: resData.code, message: resData.message });
  } catch {
    serverError(res);
  }
};

export const remove = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can post interview experiences.");
      return;
    }
    const { id } = req.params;
    const candidate = req.account as IAccountCandidate;
    const resData = await expService.removeExperienceService(id, candidate._id);
    res.status(resData.status).json({ code: resData.code, message: resData.message });
  } catch {
    serverError(res);
  }
};

export const myPosts = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can access interview experiences.");
      return;
    }
    const page = parsePage(req.query.page);
    const candidate = req.account as IAccountCandidate;
    const data = await expService.getMyExperiencesService(candidate._id, page);
    res.json({ code: "success", ...data });
  } catch {
    serverError(res);
  }
};

export const toggleHelpful = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can access interview experiences.");
      return;
    }
    const { id } = req.params;
    const candidate = req.account as IAccountCandidate;
    const result = await expService.toggleExperienceHelpfulService(id, candidate._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
export const markHelpful = toggleHelpful;

export const listComments = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can access interview experiences.");
      return;
    }
    const { id } = req.params;
    const page = parsePage(req.query.page);
    const result = await expService.listCommentsService(id, page);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
export const getComments = listComments;

export const createComment = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can post comments.");
      return;
    }
    const { id } = req.params;
    const candidate = req.account as IAccountCandidate;
    const body = req.body as expService.CreateCommentBodyDTO;

    const result = await expService.createCommentService(
      id,
      { _id: candidate._id, fullName: candidate.fullName },
      {
        content: String(body.content || ""),
        isAnonymous: body.isAnonymous,
        parentId: body.parentId
      }
    );
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const updateComment = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can manage comments.");
      return;
    }
    const { commentId } = req.params;
    const candidate = req.account as IAccountCandidate;
    const body = req.body as expService.UpdateCommentBodyDTO;

    const result = await expService.updateCommentService(commentId, candidate._id, String(body.content || ""));
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
export const editComment = updateComment;

export const removeComment = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can manage comments.");
      return;
    }
    const { commentId } = req.params;
    const candidate = req.account as IAccountCandidate;

    const result = await expService.removeCommentService(commentId, candidate._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
export const deleteComment = removeComment;

export const toggleCommentHelpful = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate" || !(req.account as IAccountCandidate).isVerified) {
      forbidden(res, "Only verified UIT students and alumni can access interview experiences.");
      return;
    }
    const { commentId } = req.params;
    const candidate = req.account as IAccountCandidate;

    const result = await expService.toggleCommentHelpfulService(commentId, candidate._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
export const markCommentHelpful = toggleCommentHelpful;

export const reportPost = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || (req.accountType !== "candidate" && req.accountType !== "company")) {
      unauthorized(res, "Login required.");
      return;
    }
    const { id } = req.params;
    const body = req.body as expService.ReportItemBodyDTO;
    const result = await expService.reportPostService(id, req.account._id, req.accountType, String(body.reason || ""));
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const reportComment = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || (req.accountType !== "candidate" && req.accountType !== "company")) {
      unauthorized(res, "Login required.");
      return;
    }
    const { commentId } = req.params;
    const body = req.body as expService.ReportItemBodyDTO;
    const result = await expService.reportCommentService(commentId, req.account._id, req.accountType, String(body.reason || ""));
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
