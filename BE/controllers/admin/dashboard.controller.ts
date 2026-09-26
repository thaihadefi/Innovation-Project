import { Response } from "express";
import { RequestAdmin } from "../../interfaces/request.interface";
import * as adminDashboardService from "../../services/admin/dashboard.service";
export const stats = async (_req: RequestAdmin, res: Response) => {
    const data = await adminDashboardService.getDashboardStatsService();
    res.json(data);
};
