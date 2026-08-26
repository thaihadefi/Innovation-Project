import { Response } from "express";
import { ALL_PERMISSIONS } from "../../models/role.model";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as adminRoleService from "../../services/admin/role.service";

export const listPermissions = (_req: RequestAdmin, res: Response): void => {
  res.json({ code: "success", permissions: ALL_PERMISSIONS });
};

export const list = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();

    const data = await adminRoleService.getRolesService(page, keyword || undefined);
    res.json(data);
  } catch {
    serverError(res);
  }
};

export const create = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const body = req.body as { name?: string; description?: string; permissions?: string[] };
    const result = await adminRoleService.createRoleService(req.admin, body);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const update = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const body = req.body as { name?: string; description?: string; permissions?: string[] };
    const result = await adminRoleService.updateRoleService(req.admin, id, body);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const remove = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const result = await adminRoleService.removeRoleService(req.admin, id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
