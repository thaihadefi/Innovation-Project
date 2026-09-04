import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as companyCvService from "../../services/company/cv.service";

export const getCVList = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const page = parsePage(req.query.page);
    const keyword = req.query.keyword ? String(req.query.keyword) : undefined;

    const data = await companyCvService.getCompanyCVListService(company._id, page, keyword);
    res.json(data);
  } catch {
    serverError(res);
  }
};

export const getCVDetail = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const cvId = String(req.params.id);

    const result = await companyCvService.getCompanyCVDetailService(cvId, company._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const changeStatusCVPatch = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const cvId = String(req.params.id);
    const body = req.body as { status?: string };

    const result = await companyCvService.changeStatusCompanyCVService(cvId, company._id, String(body.status || ""));
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const deleteCVDel = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const cvId = String(req.params.id);

    const result = await companyCvService.deleteCompanyCVService(cvId, company._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
