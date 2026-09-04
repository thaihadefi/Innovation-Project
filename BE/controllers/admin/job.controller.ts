import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import * as adminJobService from "../../services/admin/job.service";
export const list = async (req: RequestAdmin, res: Response) => {
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();
    const status = req.query.status as string | undefined;
    const data = await adminJobService.getAdminJobListService(page, keyword || undefined, status);
    res.json(data);
};
export const deleteJob = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const result = await adminJobService.deleteAdminJobService(admin, id);
    res.status(result.status).json(result);
};
