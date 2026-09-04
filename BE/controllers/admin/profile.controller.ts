import { Response } from "express";
import { RequestAdmin } from "../../interfaces/request.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as adminProfileService from "../../services/admin/profile.service";

export const getProfile = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const result = await adminProfileService.getAdminProfileService(req.admin._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const updateProfile = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const body = req.body as { fullName?: string; phone?: string; avatar?: string | null };
    const result = await adminProfileService.updateAdminProfileService(
      req.admin._id,
      body,
      req.file ? { path: req.file.path } : undefined
    );
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
