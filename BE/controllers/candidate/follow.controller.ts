import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import * as followService from "../../services/candidate/follow.service";
// All routes here are behind verifyTokenCandidate, so req.account is a candidate.
export const toggleFollowCompany = async (req: RequestAccount<{
    companyId: string;
}>, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const companyId = String(req.params.companyId);
    const result = await followService.toggleFollowCompanyService(candidate._id, companyId);
    res.status(result.status).json(result);
};
export const checkFollowStatus = async (req: RequestAccount<{
    companyId: string;
}>, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const companyId = String(req.params.companyId);
    const result = await followService.checkFollowStatusService(candidate._id, companyId);
    res.json(result);
};
export const getFollowedCompanies = async (req: RequestAccount, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();
    const data = await followService.getFollowedCompaniesService(candidate._id, page, keyword);
    res.json(data);
};
