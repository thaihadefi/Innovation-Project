import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";
import { getAuthCookieOptions } from "../../helpers/cookie.helper";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as candidateProfileService from "../../services/candidate/profile.service";

export const profilePatch = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const body = req.body as candidateProfileService.CandidateProfileUpdateDTO;

    const result = await candidateProfileService.updateCandidateProfileService(
      candidate,
      body,
      req.file ? { path: req.file.path } : undefined
    );

    res.status(result.status).json({ code: result.code, message: result.message });
  } catch {
    serverError(res);
  }
};

export const requestEmailChange = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const body = req.body as { newEmail?: string };

    const result = await candidateProfileService.requestCandidateEmailChangeService(
      candidate,
      String(body.newEmail || "")
    );

    res.status(result.status).json({ code: result.code, message: result.message });
  } catch {
    serverError(res, "Failed to request email change.");
  }
};

export const verifyEmailChange = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      unauthorized(res);
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const body = req.body as { otp?: string };

    const result = await candidateProfileService.verifyCandidateEmailChangeService(
      candidate._id,
      String(body.otp || "")
    );

    if (result.status === 200) {
      res.clearCookie("token", getAuthCookieOptions(req));
    }

    res.status(result.status).json({ code: result.code, message: result.message });
  } catch {
    serverError(res, "Failed to verify email change.");
  }
};
