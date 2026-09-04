import { Request, Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage, parsePageSize } from "../../helpers/pagination.helper";
import { paginationConfig } from "../../config/variable";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import * as publicDirectoryService from "../../services/company/public-directory.service";
// topCompanies / list / detail are public; getFollowerCount is behind verifyTokenCompany.
export const topCompanies = async (_req: Request, res: Response) => {
    const data = await publicDirectoryService.getTopCompaniesService();
    res.json(data);
};
export const list = async (req: RequestAccount, res: Response) => {
    const data = await publicDirectoryService.getPublicCompanyListService({
        keyword: req.query.keyword ? String(req.query.keyword) : undefined,
        location: req.query.location ? String(req.query.location) : undefined,
        page: req.query.page ? String(req.query.page) : undefined,
        limitItems: req.query.limitItems ? String(req.query.limitItems) : undefined
    });
    res.json(data);
};
export const detail = async (req: RequestAccount, res: Response) => {
    const slug = String(req.params.slug);
    const jobPage = parsePage(req.query.jobPage);
    const defaultJobLimit = paginationConfig.companyDetailJobs || 9;
    const maxJobLimit = paginationConfig.maxCompanyDetailJobPageSize || paginationConfig.maxPageSize || 30;
    const jobLimit = parsePageSize(req.query.jobLimit, defaultJobLimit, maxJobLimit);
    const result = await publicDirectoryService.getCompanyDetailPublicService(slug, jobPage, jobLimit);
    res.status(result.status).json(result);
};
export const getFollowerCount = async (req: RequestAccount, res: Response) => {
    const company = req.account as IAccountCompany;
    const result = await publicDirectoryService.getFollowerCountService(company._id);
    res.json(result);
};
