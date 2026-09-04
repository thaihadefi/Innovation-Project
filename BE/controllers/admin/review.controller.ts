import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import * as adminReviewService from "../../services/admin/review.service";
export const listReviews = async (req: RequestAdmin, res: Response) => {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();
    const data = await adminReviewService.getAdminReviewListService(page, keyword || undefined, status);
    res.json(data);
};
export const updateReviewStatus = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const { status } = req.body as {
        status: string;
    };
    const result = await adminReviewService.updateAdminReviewStatusService({ _id: admin._id, email: admin.email }, id, status);
    res.status(result.status).json(result);
};
export const deleteReview = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const result = await adminReviewService.deleteAdminReviewService({ _id: admin._id, email: admin.email }, id);
    res.status(result.status).json(result);
};
export const listReports = async (req: RequestAdmin, res: Response) => {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const targetType = req.query.targetType as string | undefined;
    const keyword = String(req.query.keyword || "").trim();
    const data = await adminReviewService.getAdminReportListService(page, keyword || undefined, status, targetType);
    res.json(data);
};
export const updateReportStatus = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const { status } = req.body as {
        status: string;
    };
    const result = await adminReviewService.updateAdminReportStatusService({ _id: admin._id, email: admin.email }, id, status);
    res.status(result.status).json(result);
};
