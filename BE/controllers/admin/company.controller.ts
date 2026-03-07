import { Response } from "express";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Review from "../../models/review.model";
import Notification from "../../models/notification.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.companies;
    const skip = (page - 1) * pageSize;
    const status = req.query.status as string | undefined;
    const keyword = String(req.query.keyword || "").trim();

    const filter: any = {};
    if (status && ["initial", "active", "inactive"].includes(status)) filter.status = status;
    if (keyword) filter.$or = [
      { companyName: { $regex: keyword, $options: "i" } },
      { email: { $regex: keyword, $options: "i" } },
      { phone: { $regex: keyword, $options: "i" } },
    ];

    const [total, companies] = await Promise.all([
      AccountCompany.countDocuments(filter),
      AccountCompany.find(filter)
        .select("companyName email phone location status slug logo createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    res.json({
      code: "success",
      companies,
      pagination: {
        totalRecord: total,
        totalPage: Math.max(1, Math.ceil(total / pageSize)),
        currentPage: page,
        pageSize,
      },
    });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const setStatus = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["active", "inactive", "initial"].includes(status)) {
      res.status(400).json({ code: "error", message: "Invalid status." });
      return;
    }
    const result = await AccountCompany.updateOne({ _id: id }, { status });
    if (result.matchedCount === 0) {
      res.status(404).json({ code: "error", message: "Company not found." });
      return;
    }
    // Invalidate caches so banned/unbanned companies and their jobs reflect immediately
    await invalidateJobDiscoveryCaches();
    const messages: Record<string, string> = {
      active: "Company approved and activated.",
      inactive: "Company banned.",
      initial: "Company status reset to pending.",
    };
    res.json({ code: "success", message: messages[status] });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};

export const deleteCompany = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const company = await AccountCompany.findById(id);
    if (!company) {
      res.status(404).json({ code: "error", message: "Company not found." });
      return;
    }

    // Delete company logo from Cloudinary
    if (company.logo) {
      await deleteImage(company.logo).catch(() => {});
    }

    // Delete all jobs owned by this company and their associated data
    const jobs = await Job.find({ companyId: id }).select("images").lean();
    for (const job of jobs) {
      // Delete job images from Cloudinary
      if (Array.isArray(job.images)) {
        await Promise.allSettled(job.images.map((img: string) => deleteImage(img)));
      }
      // Delete CVs for this job
      const cvs = await CV.find({ jobId: job._id }).select("fileCV").lean();
      await Promise.allSettled(cvs.map((cv: any) => cv.fileCV ? deleteImage(cv.fileCV) : Promise.resolve()));
      await CV.deleteMany({ jobId: job._id });
    }
    await Job.deleteMany({ companyId: id });

    // Clean up related data
    await Promise.allSettled([
      FollowCompany.deleteMany({ companyId: id }),
      Review.deleteMany({ companyId: id }),
      Notification.deleteMany({ companyId: id }),
    ]);

    // Delete the company account
    await AccountCompany.deleteOne({ _id: id });

    // Invalidate caches
    await invalidateJobDiscoveryCaches();

    res.json({ code: "success", message: "Company and all associated data deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
