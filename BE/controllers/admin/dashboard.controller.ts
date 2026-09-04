import { Response } from "express";
import { RequestAdmin } from "../../interfaces/request.interface";
import { serverError } from "../../helpers/response.helper";
import * as adminDashboardService from "../../services/admin/dashboard.service";

export const stats = async (_req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const data = await adminDashboardService.getDashboardStatsService();
    res.json(data);
  } catch {
    serverError(res);
  }
};
