import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as adminAccountService from "../../services/admin/account.service";

export const list = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();
    const status = req.query.status as string | undefined;
    const roleId = req.query.roleId as string | undefined;

    const data = await adminAccountService.getAdminAccountsListService(
      page,
      keyword || undefined,
      status,
      roleId
    );
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

    const body = req.body as { fullName?: string; email?: string; password?: string; phone?: string; roleId?: string };
    const result = await adminAccountService.createAdminAccountService(
      { _id: req.admin._id, email: req.admin.email, permissions: req.permissions },
      body
    );
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
    const body = req.body as { fullName?: string; email?: string; phone?: string; roleId?: string; status?: string; password?: string };
    const result = await adminAccountService.updateAdminAccountService(
      { _id: req.admin._id, email: req.admin.email, permissions: req.permissions },
      id,
      body
    );
    res.status(result.status).json(result);
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
    const result = await adminAccountService.setAdminAccountStatusService(
      { _id: req.admin._id },
      id,
      status
    );
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
    const result = await adminAccountService.removeAdminAccountService(
      { _id: req.admin._id, email: req.admin.email },
      id
    );
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const setRole = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const { roleId } = req.body as { roleId?: string };
    const result = await adminAccountService.setAdminAccountRoleService(
      { _id: req.admin._id, email: req.admin.email, permissions: req.permissions },
      id,
      roleId
    );
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
