import { Response } from "express";
import { RequestAccount } from "../interfaces/request.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { unauthorized, serverError, notFound, success } from "../helpers/response.helper";
import * as jobService from "../services/job.service";
import { deleteImage } from "../helpers/cloudinary.helper";

export const skills = async (_req: RequestAccount, res: Response): Promise<void> => {
  try {
    const data = await jobService.getJobSkills();
    res.json(data);
  } catch {
    serverError(res, "Failed to fetch skills");
  }
};

export const detail = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    const slug = String(req.params.slug);
    const viewerId = req.account?._id?.toString() || null;
    const clientIp = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";

    const result = await jobService.getJobDetailBySlug(slug, viewerId, clientIp);
    if (!result.found || !result.jobDetail) {
      notFound(res, "Job not found.");
      return;
    }

    success(res, {
      code: "success",
      message: "Success.",
      jobDetail: result.jobDetail,
    });
  } catch {
    serverError(res, "Failed to load job details.");
  }
};

export const applyPost = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "candidate") {
      if (req.file) void deleteImage(req.file.path).catch(() => {});
      unauthorized(res, "Candidate login required.");
      return;
    }

    const candidate = req.account as IAccountCandidate;
    const body = req.body as jobService.ApplyJobBodyDTO;

    const result = await jobService.applyJobService({
      jobId: String(body.jobId || ""),
      fullName: String(body.fullName || ""),
      phone: String(body.phone || ""),
      candidate,
      file: req.file ? { path: req.file.path } : undefined,
    });

    res.status(result.status).json({
      code: result.code,
      message: result.message,
    });
  } catch {
    if (req.file) void deleteImage(req.file.path).catch(() => {});
    serverError(res, "CV submission failed.");
  }
};

export const checkApplied = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    const jobId = String(req.params.jobId);
    const accountId = req.account?._id?.toString();

    const result = await jobService.checkJobAppliedStatus(jobId, req.accountType, accountId);
    res.json(result);
  } catch {
    serverError(res, "Failed to check application status.");
  }
};
