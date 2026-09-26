import { Response } from "express";
import { parsePage } from "../helpers/pagination.helper";
import { RequestAccount } from "../interfaces/request.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { notFound } from "../helpers/response.helper";
import * as expService from "../services/interview-experience.service";
// Route auth: verifyTokenCandidate + requireVerifiedCandidate guard every handler
// here except reportComment (verified status not required to report).
export const list = async (req: RequestAccount, res: Response) => {
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();
    const result = req.query.result as string | undefined;
    const difficulty = req.query.difficulty as string | undefined;
    const payload = await expService.getExperienceListService(page, keyword, result, difficulty);
    res.json(payload);
};
export const detail = async (req: RequestAccount, res: Response) => {
    const { id } = req.params;
    const result = await expService.getExperienceDetailService(id);
    if (!result.found) {
        notFound(res, "Post not found.");
        return;
    }
    res.json({ code: "success", post: result.post });
};
export const create = async (req: RequestAccount, res: Response) => {
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
};
export const update = async (req: RequestAccount, res: Response) => {
    const { id } = req.params;
    const candidate = req.account as IAccountCandidate;
    const body = req.body as expService.UpdateExperienceBodyDTO;
    const resData = await expService.updateExperienceService(id, candidate._id, body);
    res.status(resData.status).json({ code: resData.code, message: resData.message });
};
export const remove = async (req: RequestAccount, res: Response) => {
    const { id } = req.params;
    const candidate = req.account as IAccountCandidate;
    const resData = await expService.removeExperienceService(id, candidate._id);
    res.status(resData.status).json({ code: resData.code, message: resData.message });
};
export const markHelpful = async (req: RequestAccount, res: Response) => {
    const { id } = req.params;
    const candidate = req.account as IAccountCandidate;
    const result = await expService.toggleExperienceHelpfulService(id, candidate._id);
    res.status(result.status).json(result);
};
export const getComments = async (req: RequestAccount, res: Response) => {
    const { id } = req.params;
    const page = parsePage(req.query.page);
    const result = await expService.listCommentsService(id, page);
    res.status(result.status).json(result);
};
export const createComment = async (req: RequestAccount, res: Response) => {
    const { id } = req.params;
    const candidate = req.account as IAccountCandidate;
    const body = req.body as expService.CreateCommentBodyDTO;
    const result = await expService.createCommentService(id, { _id: candidate._id, fullName: candidate.fullName }, {
        content: String(body.content || ""),
        isAnonymous: body.isAnonymous,
        parentId: body.parentId
    });
    res.status(result.status).json(result);
};
export const editComment = async (req: RequestAccount, res: Response) => {
    const { commentId } = req.params;
    const candidate = req.account as IAccountCandidate;
    const body = req.body as expService.UpdateCommentBodyDTO;
    const result = await expService.updateCommentService(commentId, candidate._id, String(body.content || ""));
    res.status(result.status).json(result);
};
export const deleteComment = async (req: RequestAccount, res: Response) => {
    const { commentId } = req.params;
    const candidate = req.account as IAccountCandidate;
    const result = await expService.removeCommentService(commentId, candidate._id);
    res.status(result.status).json(result);
};
export const markCommentHelpful = async (req: RequestAccount, res: Response) => {
    const { commentId } = req.params;
    const candidate = req.account as IAccountCandidate;
    const result = await expService.toggleCommentHelpfulService(commentId, candidate._id);
    res.status(result.status).json(result);
};
export const reportComment = async (req: RequestAccount, res: Response) => {
    const { commentId } = req.params;
    const body = req.body as expService.ReportItemBodyDTO;
    const account = req.account as IAccountCandidate;
    const result = await expService.reportCommentService(commentId, account._id, req.accountType as "candidate" | "company", String(body.reason || ""));
    res.status(result.status).json(result);
};
