import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import * as analyticsService from "../../services/company/analytics.service";
export const getAnalytics = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const page = parsePage(req.query.page);
    const timeRangeInput = req.query.timeRange ? String(req.query.timeRange) : undefined;
    const sortByInput = req.query.sortBy ? String(req.query.sortBy) : undefined;
    const data = await analyticsService.getCompanyAnalyticsService(company._id, page, timeRangeInput, sortByInput);
    res.json(data);
};
