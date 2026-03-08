import { Response } from "express";
import AccountCompany from "../../models/account-company.model";
import Job from "../../models/job.model";
import CV from "../../models/cv.model";
import SavedJob from "../../models/saved-job.model";
import FollowCompany from "../../models/follow-company.model";
import Review from "../../models/review.model";
import Report from "../../models/report.model";
import Notification from "../../models/notification.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { RequestAdmin } from "../../interfaces/request.interface";
import { adminPaginationConfig } from "../../config/variable";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { queueEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { notifyCompany } from "../../helpers/socket.helper";

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
    const company = await AccountCompany.findOneAndUpdate(
      { _id: id },
      { status },
      { new: false }
    ).select("email companyName status").lean();
    if (!company) {
      res.status(404).json({ code: "error", message: "Company not found." });
      return;
    }
    // Send email + real-time noti only when transitioning to active (approved)
    if (status === "active" && (company as any).status !== "active") {
      const { subject, html } = emailTemplates.companyApproved((company as any).companyName || "Company");
      queueEmail((company as any).email, subject, html);
      const notif = await Notification.create({
        companyId: (company as any)._id,
        type: "other" as const,
        title: "Registration Approved!",
        message: "Your company registration has been approved. You can now post jobs.",
        link: "/company-manage/profile",
        read: false,
      });
      notifyCompany(id, notif);
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
    const company = await AccountCompany.findById(id).select("logo").lean();
    if (!company) {
      res.status(404).json({ code: "error", message: "Company not found." });
      return;
    }

    // Delete company logo from Cloudinary
    if (company.logo) {
      await deleteImage(company.logo).catch(() => {});
    }

    // Delete all jobs owned by this company and their associated data
    const jobs = await Job.find({ companyId: id }).select("_id images").lean();
    if (jobs.length > 0) {
      const jobIds = jobs.map((j: any) => j._id);

      // Batch fetch all CVs for all jobs in a single query (no N+1)
      const [cvs] = await Promise.all([
        CV.find({ jobId: { $in: jobIds } }).select("fileCV").lean(),
      ]);

      // Delete all job images + all CV files in parallel
      const imageDeletes = jobs.flatMap((job: any) =>
        Array.isArray(job.images) ? job.images.map((img: string) => deleteImage(img)) : []
      );
      const cvDeletes = cvs.map((cv: any) => cv.fileCV ? deleteImage(cv.fileCV) : Promise.resolve());
      await Promise.allSettled([...imageDeletes, ...cvDeletes]);

      await Promise.allSettled([
        CV.deleteMany({ jobId: { $in: jobIds } }),
        SavedJob.deleteMany({ jobId: { $in: jobIds } }),
      ]);
    }
    await Job.deleteMany({ companyId: id });

    // Clean up reviews and their reports
    const reviewIds = await Review.find({ companyId: id }).select("_id").lean();
    await Review.deleteMany({ companyId: id });
    if (reviewIds.length > 0) {
      await Report.deleteMany({ targetType: "review", targetId: { $in: reviewIds.map((r: any) => r._id) } });
    }

    // Clean up related data
    await Promise.allSettled([
      FollowCompany.deleteMany({ companyId: id }),
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
