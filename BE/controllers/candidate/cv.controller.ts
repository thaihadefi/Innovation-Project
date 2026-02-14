import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import CV from "../../models/cv.model";
import Job from "../../models/job.model";
import AccountCompany from "../../models/account-company.model";
import City from "../../models/city.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { paginationConfig } from "../../config/variable";

export const getCVList = async (req: RequestAccount, res: Response) => {
  try {
    const email = req.account.email;
    const page = Math.max(1, parseInt(String(req.query.page || "1"), 10) || 1);
    const pageSize = paginationConfig.candidateApplicationsList || 6;
    const skip = (page - 1) * pageSize;
    const keyword = String(req.query.keyword || "").trim();

    const cvFind: any = { email: email };

    if (keyword) {
      const safeKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const keywordRegex = new RegExp(safeKeyword, "i");
      const companies = await AccountCompany.find({ companyName: keywordRegex }).select("_id").lean();
      const companyIds = companies.map((c: any) => c._id);
      const jobsMatched = await Job.find({
        $or: [
          { title: keywordRegex },
          ...(companyIds.length > 0 ? [{ companyId: { $in: companyIds } }] : []),
        ]
      }).select("_id").lean();
      const matchedJobIds = jobsMatched.map((j: any) => j._id);
      if (matchedJobIds.length === 0) {
        return res.json({
          code: "success",
          message: "Success.",
          cvList: [],
          pagination: {
            totalRecord: 0,
            totalPage: 1,
            currentPage: page,
            pageSize
          }
        });
      }
      cvFind.jobId = { $in: matchedJobIds };
    }

    const [totalRecord, cvList] = await Promise.all([
      CV.countDocuments(cvFind),
      CV
        .find(cvFind)
        .sort({
          createdAt: "desc"
        })
        .skip(skip)
        .limit(pageSize)
        .lean()
    ]);

    if (cvList.length === 0) {
      return res.json({
        code: "success",
        message: "Success.",
        cvList: [],
        pagination: {
          totalRecord,
          totalPage: Math.max(1, Math.ceil(totalRecord / pageSize)),
          currentPage: page,
          pageSize
        }
      });
    }

    // Bulk fetch all jobs (1 query instead of N)
    const jobIds = [...new Set(cvList.map(cv => cv.jobId?.toString()).filter(Boolean))];
    const jobs = await Job.find({ _id: { $in: jobIds } }).select('title slug companyId cities salaryMin salaryMax position workingForm expirationDate').lean(); // Only display fields
    const jobMap = new Map(jobs.map(j => [j._id.toString(), j]));

    // Bulk fetch all companies (1 query instead of N)
    const companyIds = [...new Set(jobs.map(j => j.companyId?.toString()).filter(Boolean))];
    const companies = await AccountCompany.find({ _id: { $in: companyIds } }).select('companyName logo').lean(); // Only needed fields
    const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

    // Bulk fetch all cities (1 query instead of N)
    const allCityIds = [...new Set(
      jobs.flatMap(j => (j.cities || []) as any[])
        .map((id: any) => id?.toString?.() || id)
        .filter((id: any) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
    )];
    const cities = allCityIds.length > 0 ? await City.find({ _id: { $in: allCityIds } }).select('name').lean() : []; // Only need name
    const cityMap = new Map(cities.map((c: any) => [c._id.toString(), c.name]));

    // Build response using Maps for O(1) lookups
    const dataFinal = [];
    for (const item of cvList) {
      const jobInfo = jobMap.get(item.jobId?.toString() || '');
      const companyInfo = jobInfo ? companyMap.get(jobInfo.companyId?.toString() || '') : null;
      
      if (jobInfo && companyInfo) {
        // Get city names from map
        const jobCityNames = ((jobInfo.cities || []) as any[])
          .map(cityId => cityMap.get(cityId?.toString?.() || cityId))
          .filter(Boolean) as string[];

        const isExpired = jobInfo.expirationDate ? new Date(jobInfo.expirationDate) < new Date() : false;
        const itemFinal = {
          id: item._id,
          jobTitle: jobInfo.title,
          jobSlug: jobInfo.slug,
          companyName: companyInfo.companyName,
          companyLogo: companyInfo.logo,
          salaryMin: jobInfo.salaryMin,
          salaryMax: jobInfo.salaryMax,
          position: jobInfo.position,
          workingForm: jobInfo.workingForm,
          technologies: jobInfo.technologies || [],
          jobCities: jobCityNames,
          status: item.status,
          fileCV: item.fileCV,
          appliedAt: item.createdAt,
          isExpired: isExpired,
          expirationDate: jobInfo.expirationDate || null,
        };
        dataFinal.push(itemFinal);
      }
    }
  
    res.json({
      code: "success",
      message: "Success.",
      cvList: dataFinal,
      pagination: {
        totalRecord,
        totalPage: Math.max(1, Math.ceil(totalRecord / pageSize)),
        currentPage: page,
        pageSize
      }
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid request data."
    })
  }
}

// Get CV detail for viewing/editing
export const getCVDetail = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const email = req.account.email;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({
        code: "error",
        message: "CV not found."
      });
      return;
    }

    const cvInfo = await CV.findOne({
      _id: cvId,
      email: email
    }).select('fullName email phone fileCV status jobId viewed createdAt') // Only display fields

    if(!cvInfo) {
      res.json({
        code: "error",
        message: "CV not found."
      })
      return;
    }

    const jobInfo = await Job.findOne({
      _id: cvInfo.jobId
    }).select('title slug companyId expirationDate') // Only needed fields

    const isExpired = jobInfo?.expirationDate ? new Date(jobInfo.expirationDate) < new Date() : false;

    const cvDetail = {
      id: cvInfo.id,
      fullName: cvInfo.fullName,
      email: cvInfo.email,
      phone: cvInfo.phone,
      fileCV: cvInfo.fileCV,
      status: cvInfo.status,
      jobTitle: jobInfo?.title || "",
      jobSlug: jobInfo?.slug || "",
      isExpired: isExpired,
      expirationDate: jobInfo?.expirationDate || null,
    };

    res.json({
      code: "success",
      message: "Success.",
      cvDetail: cvDetail
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed."
    })
  }
}

// Update CV information
export const updateCVPatch = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const email = req.account.email;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found." });
      return;
    }

    const cvInfo = await CV.findOne({
      _id: cvId,
      email: email
    }).select('status fileCV jobId') // Only need status, fileCV, jobId

    if(!cvInfo) {
      res.json({
        code: "error",
        message: "CV not found."
      })
      return;
    }

    // Lock CV editing after it has been reviewed
    if (cvInfo.status !== "initial") {
      res.json({
        code: "error",
        message: "Cannot edit application after it has been reviewed by the company."
      })
      return;
    }

    // Lock CV editing after job expired (if expirationDate exists)
    const jobInfo = await Job.findOne({ _id: cvInfo.jobId }).select('expirationDate').lean();
    if (jobInfo?.expirationDate && new Date(jobInfo.expirationDate) < new Date()) {
      res.json({
        code: "error",
        message: "Cannot edit application after the job has expired."
      });
      return;
    }

    // If new file uploaded, delete old file from Cloudinary
    if (req.file && cvInfo.fileCV) {
      await deleteImage(cvInfo.fileCV as string);
    }

    // Validate phone number if provided
    if (req.body.phone) {
      const phoneRegex = /^(84|0[35789])[0-9]{8}$/;
      if (!phoneRegex.test(req.body.phone)) {
        res.json({
          code: "error",
          message: "Invalid phone number! Please use Vietnamese format (e.g., 0912345678)"
        })
        return;
      }
    }

    const updateData: {
      fullName?: string;
      phone?: string;
      fileCV?: string;
    } = {};

    if (req.body.fullName) updateData.fullName = req.body.fullName;
    if (req.body.phone) updateData.phone = req.body.phone;
    if (req.file) updateData.fileCV = req.file.path;

    await CV.updateOne({
      _id: cvId
    }, updateData);

    res.json({
      code: "success",
      message: "CV updated successfully."
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to update CV."
    })
  }
}

// Delete CV
export const deleteCVDel = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const email = req.account.email;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found." });
      return;
    }

    const cvInfo = await CV.findOne({
      _id: cvId,
      email: email
    }).select('fileCV status jobId') // Need jobId to update job counters

    if(!cvInfo) {
      res.json({
        code: "error",
        message: "CV not found."
      })
      return;
    }
    // Update job counts before deleting CV
    const updateCounts: Record<string, number> = {
      applicationCount: -1  // Always decrement application count
    };
    if (cvInfo.status === "approved") {
      updateCounts.approvedCount = -1;  // Decrement approved count if CV was approved
    }
    await Job.updateOne(
      { _id: cvInfo.jobId },
      { $inc: updateCounts }
    );

    // Delete CV file from Cloudinary
    if (cvInfo.fileCV) {
      await deleteImage(cvInfo.fileCV as string);
    }

    await CV.deleteOne({
      _id: cvId
    });

    // applicationCount/approvedCount changed; invalidate discovery/count caches
    await invalidateJobDiscoveryCaches();

    res.json({
      code: "success",
      message: "CV deleted successfully."
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to delete CV."
    })
  }
}
