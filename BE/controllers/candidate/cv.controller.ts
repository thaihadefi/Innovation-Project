import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as candidateCvService from "../../services/candidate/cv.service";
import { deleteImage } from "../../helpers/cloudinary.helper";

export const getCVList = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();

    const data = await candidateCvService.getCandidateCVListService(candidate._id, page, keyword);
    res.json(data);
  } catch {
    serverError(res);
  }
};

export const getCVDetail = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const cvId = String(req.params.id);

    const result = await candidateCvService.getCandidateCVDetailService(cvId, candidate._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res, "Failed.");
  }
};

export const updateCVPatch = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      if (req.file) void deleteImage(req.file.path).catch(() => {});
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const cvId = String(req.params.id);
    const body = req.body as { fullName?: string; phone?: string };

    const result = await candidateCvService.updateCandidateCVService(
      cvId,
      candidate._id,
      body,
      req.file ? { path: req.file.path } : undefined
    );

    res.status(result.status).json(result);
  } catch {
    if (req.file) {
      void deleteImage(req.file.path).catch((e) => console.error("[Cloudinary] Failed to delete orphaned CV:", e));
    }
    serverError(res, "Failed to update CV.");
  }
};

export const deleteCVDel = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const cvId = String(req.params.id);

    const result = await candidateCvService.deleteCandidateCVService(cvId, candidate._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res, "Failed to delete CV.");
  }
};
