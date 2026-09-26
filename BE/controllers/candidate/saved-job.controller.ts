import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import * as savedJobService from "../../services/candidate/saved-job.service";
// All routes here are behind verifyTokenCandidate, so req.account is a candidate.
export const toggleSaveJob = async (req: RequestAccount, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const jobId = String(req.params.jobId);
    const result = await savedJobService.toggleSaveJobService(candidate._id, jobId);
    res.status(result.status).json(result);
};
export const checkSaveStatus = async (req: RequestAccount, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const jobId = String(req.params.jobId);
    const result = await savedJobService.checkSaveStatusService(candidate._id, jobId);
    res.status(result.status).json(result);
};
export const getSavedJobs = async (req: RequestAccount, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();
    const data = await savedJobService.getSavedJobsService(candidate._id, page, keyword);
    res.json(data);
};
