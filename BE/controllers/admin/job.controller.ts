import { Response } from "express";
import Job from "../../models/job.model";
import AccountCompany from "../../models/account-company.model";
import CV from "../../models/cv.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.jobs;
    const skip = (page - 1) * pageSize;
    const keyword = String(req.query.keyword || "").trim();

    const filter: any = {};
    if (keyword) filter.$or = [
      { title: { $regex: keyword, $options: "i" } },
    ];

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .select("title companyId position workingForm salaryMin salaryMax applicationCount createdAt expirationDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    // Attach company names
    const companyIds = [...new Set(jobs.map((j: any) => j.companyId?.toString()).filter(Boolean))];
    const companies = await AccountCompany.find({ _id: { $in: companyIds } }).select("companyName").lean();
    const companyMap = new Map(companies.map((c: any) => [c._id.toString(), c.companyName]));

    const jobsWithCompany = jobs.map((j: any) => ({
      ...j,
      companyName: companyMap.get(j.companyId?.toString()) || "Unknown",
    }));

    res.json({
      code: "success",
      jobs: jobsWithCompany,
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

export const deleteJob = async (req: RequestAdmin, res: Response) => {
  try {
    const { id } = req.params;
    const job = await Job.findById(id).select("images");
    if (!job) {
      res.status(404).json({ code: "error", message: "Job not found." });
      return;
    }

    // Delete associated images from Cloudinary
    if (Array.isArray(job.images)) {
      await Promise.allSettled(job.images.map((img: string) => deleteImage(img)));
    }

    // Delete associated CVs
    const cvs = await CV.find({ jobId: id }).select("fileCV").lean();
    await Promise.allSettled(cvs.map((cv: any) => cv.fileCV ? deleteImage(cv.fileCV) : Promise.resolve()));
    await CV.deleteMany({ jobId: id });

    await Job.deleteOne({ _id: id });

    res.json({ code: "success", message: "Job post deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
