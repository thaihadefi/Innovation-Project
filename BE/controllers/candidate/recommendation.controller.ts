import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import * as recommendationService from "../../services/candidate/recommendation.service";
export const getRecommendations = async (req: RequestAccount, res: Response) => {
    const candidate = req.account as IAccountCandidate;
    const data = await recommendationService.getRecommendationsService(candidate._id);
    res.json(data);
};
