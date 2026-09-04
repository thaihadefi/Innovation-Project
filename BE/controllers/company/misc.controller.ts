import { Request, Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage, parsePageSize } from "../../helpers/pagination.helper";
import { paginationConfig } from "../../config/variable";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as companyMiscService from "../../services/company/misc.service";

export const topCompanies = async (_req: Request, res: Response): Promise<void> => {
  try {
    const data = await companyMiscService.getTopCompaniesService();
    res.json(data);
  } catch {
    serverError(res, "Failed to fetch top companies");
  }
};

export const list = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    const data = await companyMiscService.getPublicCompanyListService({
      keyword: req.query.keyword ? String(req.query.keyword) : undefined,
      location: req.query.location ? String(req.query.location) : undefined,
      page: req.query.page ? String(req.query.page) : undefined,
      limitItems: req.query.limitItems ? String(req.query.limitItems) : undefined
    });
    res.json(data);
  } catch {
    serverError(res);
  }
};

export const detail = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    const slug = String(req.params.slug);
    const jobPage = parsePage(req.query.jobPage);
    const defaultJobLimit = paginationConfig.companyDetailJobs || 9;
    const maxJobLimit = paginationConfig.maxCompanyDetailJobPageSize || paginationConfig.maxPageSize || 30;
    const jobLimit = parsePageSize(req.query.jobLimit, defaultJobLimit, maxJobLimit);

    const result = await companyMiscService.getCompanyDetailPublicService(slug, jobPage, jobLimit);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const getFollowerCount = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const result = await companyMiscService.getFollowerCountService(company._id);
    res.json(result);
  } catch {
    serverError(res, "Failed to get follower count.");
  }
};

export const getCompanyNotifications = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const page = parsePage(req.query.page);

    const data = await companyMiscService.getCompanyNotificationsService(company._id, page);
    res.json(data);
  } catch {
    serverError(res, "Failed to get notifications.");
  }
};

export const markCompanyNotificationRead = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const notifId = String(req.params.id);

    const result = await companyMiscService.markCompanyNotificationReadService(company._id, notifId);
    res.status(result.status).json(result);
  } catch {
    serverError(res, "Failed to mark notification as read.");
  }
};

export const markAllCompanyNotificationsRead = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const result = await companyMiscService.markAllCompanyNotificationsReadService(company._id);
    res.json(result);
  } catch {
    serverError(res, "Failed to mark notifications as read.");
  }
};

export const getAnalytics = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const page = parsePage(req.query.page);
    const timeRangeInput = req.query.timeRange ? String(req.query.timeRange) : undefined;
    const sortByInput = req.query.sortBy ? String(req.query.sortBy) : undefined;

    const data = await companyMiscService.getCompanyAnalyticsService(
      company._id,
      page,
      timeRangeInput,
      sortByInput
    );
    res.json(data);
  } catch {
    serverError(res, "Failed to get analytics.");
  }
};
