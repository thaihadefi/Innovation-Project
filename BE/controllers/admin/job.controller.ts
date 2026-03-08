import { Response } from "express";
import Job from "../../models/job.model";
import Location from "../../models/location.model";
import AccountCompany from "../../models/account-company.model";
import CV from "../../models/cv.model";
import SavedJob from "../../models/saved-job.model";
import JobView from "../../models/job-view.model";
import Notification from "../../models/notification.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";

export const list = async (req: RequestAdmin, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")) || 1);
    const pageSize = adminPaginationConfig.jobs;
    const skip = (page - 1) * pageSize;
    const keyword = String(req.query.keyword || "").trim();
    const status = req.query.status as string | undefined; // "active" | "expired"

    const now = new Date();
    const filter: any = {};

    // Keyword search across title, position, and company name
    if (keyword) {
      // Find companies matching keyword to support companyName search
      const matchingCompanies = await AccountCompany.find(
        { companyName: { $regex: keyword, $options: "i" } },
        { _id: 1 }
      ).lean();
      const matchingCompanyIds = matchingCompanies.map((c: any) => c._id);

      filter.$or = [
        { title: { $regex: keyword, $options: "i" } },
        { position: { $regex: keyword, $options: "i" } },
        ...(matchingCompanyIds.length > 0 ? [{ companyId: { $in: matchingCompanyIds } }] : []),
      ];
    }

    if (status === "active") {
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ expirationDate: null }, { expirationDate: { $gt: now } }] });
    }
    if (status === "expired") filter.expirationDate = { $lte: now };

    const [total, jobs] = await Promise.all([
      Job.countDocuments(filter),
      Job.find(filter)
        .select("title slug companyId salaryMin salaryMax applicationCount locations createdAt expirationDate")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean(),
    ]);

    // Attach company names
    const companyIds = [...new Set(jobs.map((j: any) => j.companyId?.toString()).filter(Boolean))];
    const companies = await AccountCompany.find({ _id: { $in: companyIds } }).select("companyName").lean();
    const companyMap = new Map(companies.map((c: any) => [c._id.toString(), c.companyName]));

    // Attach location names
    const allLocationIds = [...new Set(jobs.flatMap((j: any) => j.locations || []).map(String).filter(Boolean))];
    const locations = await Location.find({ _id: { $in: allLocationIds } }).select("name").lean();
    const locationMap = new Map(locations.map((l: any) => [l._id.toString(), l.name]));

    const jobsWithDetails = jobs.map((j: any) => ({
      ...j,
      companyName: companyMap.get(j.companyId?.toString()) || "Unknown",
      locationNames: (j.locations || []).map((id: any) => locationMap.get(id.toString()) || null).filter(Boolean),
    }));

    res.json({
      code: "success",
      jobs: jobsWithDetails,
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
    const job = await Job.findById(id).select("images").lean();
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

    await Promise.allSettled([
      Job.deleteOne({ _id: id }),
      SavedJob.deleteMany({ jobId: id }),
      JobView.deleteMany({ jobId: id }),
      Notification.deleteMany({ 'data.jobId': id }),
    ]);
    await invalidateJobDiscoveryCaches();

    res.json({ code: "success", message: "Job post deleted." });
  } catch {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
};
