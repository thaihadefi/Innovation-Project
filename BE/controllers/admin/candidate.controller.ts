import { Response } from "express";
import { parsePage } from "../../helpers/pagination.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { badRequest } from "../../helpers/response.helper";
import * as adminCandidateService from "../../services/admin/candidate.service";
export const list = async (req: RequestAdmin, res: Response) => {
    const page = parsePage(req.query.page);
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();
    const verified = req.query.verified as string | undefined;
    const data = await adminCandidateService.getAdminCandidateListService(page, keyword || undefined, status, verified);
    res.json(data);
};
export const setVerified = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const { isVerified } = req.body as {
        isVerified: boolean;
    };
    if (typeof isVerified !== "boolean") {
        badRequest(res, "isVerified must be a boolean.");
        return;
    }
    const result = await adminCandidateService.setAdminCandidateVerifiedService(admin, id, isVerified);
    res.status(result.status).json(result);
};
export const setStatus = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const { status } = req.body as {
        status: string;
    };
    const result = await adminCandidateService.setAdminCandidateStatusService(admin, id, status);
    res.status(result.status).json(result);
};
export const deleteCandidate = async (req: RequestAdmin, res: Response) => {
    const admin = req.admin!;
    const { id } = req.params;
    const result = await adminCandidateService.deleteAdminCandidateService(admin, id);
    res.status(result.status).json(result);
};
