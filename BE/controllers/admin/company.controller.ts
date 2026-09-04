import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as adminCompanyService from "../../services/admin/company.service";

export const list = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const data = await adminCompanyService.getAdminCompanyListService(page, keyword || undefined, status);
    res.json(data);
  } catch {
    serverError(res);
  }
};

export const setStatus = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const { status } = req.body as { status: string };

    const result = await adminCompanyService.setAdminCompanyStatusService(req.admin, id, status);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const deleteCompany = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const result = await adminCompanyService.deleteAdminCompanyService(req.admin, id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
