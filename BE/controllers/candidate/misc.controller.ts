import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as candidateMiscService from "../../services/candidate/misc.service";

export const toggleFollowCompany = async (req: RequestAccount<{ companyId: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const companyId = String(req.params.companyId);

    const result = await candidateMiscService.toggleFollowCompanyService(candidate._id, companyId);
    res.status(result.status).json(result);
  } catch {
    serverError(res, "Failed.");
  }
};

export const checkFollowStatus = async (req: RequestAccount<{ companyId: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res, "Candidate login required.");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const companyId = String(req.params.companyId);

    const result = await candidateMiscService.checkFollowStatusService(candidate._id, companyId);
    res.json(result);
  } catch {
    serverError(res, "Failed to check follow status.");
  }
};

export const getFollowedCompanies = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();

    const data = await candidateMiscService.getFollowedCompaniesService(candidate._id, page, keyword);
    res.json(data);
  } catch {
    serverError(res, "Failed to get followed companies.");
  }
};

export const getNotifications = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const page = parsePage(req.query.page);

    const data = await candidateMiscService.getCandidateNotificationsService(candidate._id, page);
    res.json(data);
  } catch {
    serverError(res, "Failed to get notifications.");
  }
};

export const markNotificationRead = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const notificationId = String(req.params.notificationId);

    const result = await candidateMiscService.markCandidateNotificationReadService(candidate._id, notificationId);
    res.status(result.status).json(result);
  } catch {
    serverError(res, "Failed.");
  }
};

export const markAllNotificationsRead = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const result = await candidateMiscService.markAllCandidateNotificationsReadService(candidate._id);
    res.json(result);
  } catch {
    serverError(res, "Failed.");
  }
};

export const toggleSaveJob = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const jobId = String(req.params.jobId);

    const result = await candidateMiscService.toggleSaveJobService(candidate._id, jobId);
    res.status(result.status).json(result);
  } catch (error) {
    console.error("toggleSaveJob error:", error);
    serverError(res, "Failed to save job.");
  }
};

export const checkSaveStatus = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res, "Candidate login required.");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const jobId = String(req.params.jobId);

    const result = await candidateMiscService.checkSaveStatusService(candidate._id, jobId);
    res.status(result.status).json(result);
  } catch {
    serverError(res, "Failed.");
  }
};

export const getSavedJobs = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const page = parsePage(req.query.page);
    const keyword = String(req.query.keyword || "").trim();

    const data = await candidateMiscService.getSavedJobsService(candidate._id, page, keyword);
    res.json(data);
  } catch {
    serverError(res, "Failed to get saved jobs.");
  }
};

export const getRecommendations = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const data = await candidateMiscService.getRecommendationsService(candidate._id);
    res.json(data);
  } catch {
    serverError(res, "Failed to get recommendations");
  }
};
