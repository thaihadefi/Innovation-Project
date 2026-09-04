import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { unauthorized, serverError, badRequest } from "../../helpers/response.helper";
import * as adminCandidateService from "../../services/admin/candidate.service";

export const list = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();
    const verified = req.query.verified as string | undefined;

    const data = await adminCandidateService.getAdminCandidateListService(
      page,
      keyword || undefined,
      status,
      verified
    );
    res.json(data);
  } catch {
    serverError(res);
  }
};

export const setVerified = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const { isVerified } = req.body as { isVerified: boolean };
    if (typeof isVerified !== "boolean") {
      badRequest(res, "isVerified must be a boolean.");
      return;
    }

    const result = await adminCandidateService.setAdminCandidateVerifiedService(req.admin, id, isVerified);
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

    const result = await adminCandidateService.setAdminCandidateStatusService(req.admin, id, status);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const deleteCandidate = async (req: RequestAdmin, res: Response): Promise<void> => {
  try {
    if (!req.admin) {
      unauthorized(res);
      return;
    }

    const { id } = req.params;
    const result = await adminCandidateService.deleteAdminCandidateService(req.admin, id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
