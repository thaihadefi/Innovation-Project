import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import * as adminInterviewExperienceService from "../../services/admin/interview-experience.service";
export const list = async (req: RequestAdmin, res: Response) => {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();
    const data = await adminInterviewExperienceService.getAdminInterviewExperienceListService(page, keyword || undefined, status);
    res.json(data);
};
export const updateStatus = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const { status } = req.body as {
        status: string;
    };
    const result = await adminInterviewExperienceService.updateAdminInterviewExperienceStatusService(admin, id, status);
    res.status(result.status).json(result);
};
export const remove = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const result = await adminInterviewExperienceService.removeAdminInterviewExperienceService(admin, id);
    res.status(result.status).json(result);
};
export const deleteComment = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { commentId } = req.params;
    const result = await adminInterviewExperienceService.deleteAdminExperienceCommentService(admin, commentId);
    res.status(result.status).json(result);
};
