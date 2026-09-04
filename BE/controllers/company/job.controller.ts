import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import { parsePage } from "../../helpers/pagination.helper";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";
import { unauthorized, serverError } from "../../helpers/response.helper";
import * as companyJobService from "../../services/company/job.service";
import { deleteImages } from "../../helpers/cloudinary.helper";

export const createJobPost = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const body = req.body as Record<string, unknown>;
    const files = req.files && Array.isArray(req.files) ? req.files.map(f => ({ path: f.path })) : undefined;

    const result = await companyJobService.createCompanyJobService({
      companyId: company._id,
      companyName: company.companyName,
      title: String(body.title || ""),
      salaryMin: body.salaryMin as string | number | undefined,
      salaryMax: body.salaryMax as string | number | undefined,
      maxApplications: body.maxApplications as string | number | undefined,
      maxApproved: body.maxApproved as string | number | undefined,
      expirationDate: body.expirationDate as string | Date | undefined,
      position: body.position as string | undefined,
      workingForm: body.workingForm as string | undefined,
      skills: body.skills as string[] | string | undefined,
      locations: body.locations as string | string[] | undefined,
      description: body.description as string | undefined,
      benefit: body.benefit as string | undefined,
      requirement: body.requirement as string | undefined,
      files
    });

    res.status(result.status).json(result);
  } catch (error) {
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      void deleteImages(req.files.map((f) => f.path)).catch((e) => console.error("[Cloudinary] Failed to delete orphaned images:", e));
    }
    console.error("[Job] createJobPost failed:", error);
    serverError(res);
  }
};

export const getJobList = async (req: RequestAccount, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const page = parsePage(req.query.page);
    const keyword = req.query.keyword ? String(req.query.keyword) : undefined;

    const data = await companyJobService.getCompanyJobListService(company._id, page, keyword);
    res.json(data);
  } catch {
    serverError(res);
  }
};

export const getJobEdit = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const jobId = String(req.params.id);

    const result = await companyJobService.getCompanyJobEditService(jobId, company._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};

export const jobEditPatch = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const jobId = String(req.params.id);
    const body = req.body as Record<string, unknown>;
    const files = req.files && Array.isArray(req.files) ? req.files.map(f => ({ path: f.path })) : undefined;

    const result = await companyJobService.editCompanyJobService(jobId, company._id, {
      title: body.title as string | undefined,
      salaryMin: body.salaryMin as string | number | undefined,
      salaryMax: body.salaryMax as string | number | undefined,
      maxApplications: body.maxApplications as string | number | undefined,
      maxApproved: body.maxApproved as string | number | undefined,
      expirationDate: body.expirationDate as string | Date | undefined,
      position: body.position as string | undefined,
      workingForm: body.workingForm as string | undefined,
      skills: body.skills as string[] | string | undefined,
      locations: body.locations as string | string[] | undefined,
      description: body.description as string | undefined,
      benefit: body.benefit as string | undefined,
      requirement: body.requirement as string | undefined,
      imageOrder: body.imageOrder as string | undefined,
      existingImages: body.existingImages as string | undefined,
      files
    });

    res.status(result.status).json(result);
  } catch (error) {
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      void deleteImages(req.files.map((f) => f.path)).catch((e) => console.error("[Cloudinary] Failed to delete orphaned images:", e));
    }
    console.error("[Job] jobEditPatch failed:", error);
    serverError(res);
  }
};

export const deleteJobDel = async (req: RequestAccount<{ id: string }>, res: Response): Promise<void> => {
  try {
    if (!req.account || req.accountType !== "company") {
      unauthorized(res);
      return;
    }

    const company = req.account as IAccountCompany;
    const jobId = String(req.params.id);

    const result = await companyJobService.deleteCompanyJobService(jobId, company._id);
    res.status(result.status).json(result);
  } catch {
    serverError(res);
  }
};
