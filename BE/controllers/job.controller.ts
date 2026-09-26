import { Response } from "express";
import { RequestAccount } from "../interfaces/request.interface";
import { IAccountCandidate } from "../interfaces/models/account-candidate.interface";
import { notFound } from "../helpers/response.helper";
import * as jobService from "../services/job.service";
import { deleteImage } from "../helpers/cloudinary.helper";
export const skills = async (_req: RequestAccount, res: Response) => {
    const data = await jobService.getJobSkills();
    res.json(data);
};
export const detail = async (req: RequestAccount, res: Response) => {
    const slug = String(req.params.slug);
    const viewerId = req.account?._id?.toString() || null;
    const clientIp = req.ip || (req.headers["x-forwarded-for"] as string) || "unknown";
    const result = await jobService.getJobDetailBySlug(slug, viewerId, clientIp);
    if (!result.found || !result.jobDetail) {
        notFound(res, "Job not found.");
        return;
    }
    res.json({
        code: "success",
        message: "Success.",
        jobDetail: result.jobDetail,
    });
};
export const applyPost = async (req: RequestAccount, res: Response) => {
    // Route: verifyTokenCandidate runs before multer, so req.account is a candidate.
    const candidate = req.account as IAccountCandidate;
    const body = req.body as jobService.ApplyJobBodyDTO;
    try {
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
    }
    catch (error) {
        if (req.file)
            void deleteImage(req.file.path).catch(() => { });
        throw error;
    }
};
export const checkApplied = async (req: RequestAccount, res: Response) => {
    const jobId = String(req.params.jobId);
    const accountId = req.account?._id?.toString();
    const result = await jobService.checkJobAppliedStatus(jobId, req.accountType, accountId);
    res.json(result);
};
