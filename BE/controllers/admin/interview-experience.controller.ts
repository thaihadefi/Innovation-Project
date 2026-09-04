import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as adminInterviewExperienceService from "../../services/admin/interview-experience.service";

export const list = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const data = await adminInterviewExperienceService.getAdminInterviewExperienceListService(
      page,
      keyword || undefined,
      status
    );
    res.json(data);
  } catch (err) {
    console.error("Admin list experiences error:", err);
    serverError(res);
  }
};

export const updateStatus = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const { status } = req.body as { status: string };

    const result = await adminInterviewExperienceService.updateAdminInterviewExperienceStatusService(
      req.admin,
      id,
      status
    );
    res.status(result.status).json(result);
  } catch (err) {
    console.error("Admin updateStatus experience error:", err);
    serverError(res);
  }
};

export const remove = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const result = await adminInterviewExperienceService.removeAdminInterviewExperienceService(
      req.admin,
      id
    );
    res.status(result.status).json(result);
  } catch (err) {
    console.error("Admin remove experience error:", err);
    serverError(res);
  }
};

export const deleteComment = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { commentId } = req.params;
    const result = await adminInterviewExperienceService.deleteAdminExperienceCommentService(
      req.admin,
      commentId
    );
    res.status(result.status).json(result);
  } catch (err) {
    console.error("Admin deleteComment experience error:", err);
    serverError(res);
  }
};
