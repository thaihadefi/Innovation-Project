import { Response } from "express";
import { ALL_PERMISSIONS } from "../../models/role.model";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import * as adminRoleService from "../../services/admin/role.service";
export const listPermissions = (_req: RequestAdmin, res: Response): void => {
    res.json({ code: "success", permissions: ALL_PERMISSIONS });
};
export const list = async (req: RequestAdmin, res: Response) => {
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();
    const data = await adminRoleService.getRolesService(page, keyword || undefined);
    res.json(data);
};
export const create = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const body = req.body as {
        name?: string;
        description?: string;
        permissions?: string[];
    };
    const result = await adminRoleService.createRoleService(admin, body);
    res.status(result.status).json(result);
};
export const update = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const body = req.body as {
        name?: string;
        description?: string;
        permissions?: string[];
    };
    const result = await adminRoleService.updateRoleService(admin, id, body);
    res.status(result.status).json(result);
};
export const remove = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const result = await adminRoleService.removeRoleService(admin, id);
    res.status(result.status).json(result);
};
