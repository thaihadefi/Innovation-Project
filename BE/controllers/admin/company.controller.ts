import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import * as adminCompanyService from "../../services/admin/company.service";
export const list = async (req: RequestAdmin, res: Response) => {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();
    const data = await adminCompanyService.getAdminCompanyListService(page, keyword || undefined, status);
    res.json(data);
};
export const setStatus = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const { status } = req.body as {
        status: string;
    };
    const result = await adminCompanyService.setAdminCompanyStatusService(admin, id, status);
    res.status(result.status).json(result);
};
export const deleteCompany = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const result = await adminCompanyService.deleteAdminCompanyService(admin, id);
    res.status(result.status).json(result);
};
