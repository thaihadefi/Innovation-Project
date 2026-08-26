import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as adminReviewService from "../../services/admin/review.service";

export const listReviews = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const data = await adminReviewService.getAdminReviewListService(page, keyword || undefined, status);
    res.json(data);
  } catch (error) {
    console.error("Admin list reviews error:", error);
    serverError(res);
  }
};

export const updateReviewStatus = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const { status } = req.body as { status: string };

    const result = await adminReviewService.updateAdminReviewStatusService(
      { _id: req.admin._id, email: req.admin.email },
      id,
      status
    );
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Admin update review status error:", error);
    serverError(res);
  }
};

export const deleteReview = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const result = await adminReviewService.deleteAdminReviewService(
      { _id: req.admin._id, email: req.admin.email },
      id
    );
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Admin delete review error:", error);
    serverError(res);
  }
};

export const listReports = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const data = await adminReviewService.getAdminReportListService(
      page,
      keyword || undefined,
      status,
      targetType
    );
    res.json(data);
  } catch (error) {
    console.error("Admin list reports error:", error);
    serverError(res);
  }
};

export const updateReportStatus = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const { status } = req.body as { status: string };

    const result = await adminReviewService.updateAdminReportStatusService(
      { _id: req.admin._id, email: req.admin.email },
      id,
      status
    );
    res.status(result.status).json(result);
  } catch (error) {
    console.error("Admin update report status error:", error);
    serverError(res);
  }
};
