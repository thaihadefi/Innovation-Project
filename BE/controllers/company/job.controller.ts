import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import Job from "../../models/job.model";
import City from "../../models/city.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Notification from "../../models/notification.model";
import AccountCandidate from "../../models/account-candidate.model";
import JobView from "../../models/job-view.model";
import { deleteImage, deleteImages } from "../../helpers/cloudinary.helper";
import { generateUniqueSlug } from "../../helpers/slugify.helper";
import { normalizeTechnologies, normalizeTechnologyKey } from "../../helpers/technology.helper";
import cache, { CACHE_TTL } from "../../helpers/cache.helper";
import { notificationConfig, paginationConfig } from "../../config/variable";
import { queueEmail } from "../../helpers/mail.helper";

// Helper: Send notifications to followers when new job is posted
export const sendJobNotificationsToFollowers = async (
  companyId: string, 
  companyName: string, 
  jobId: string, 
  jobTitle: string, 
  jobSlug: string
) => {
  try {
    // Get all followers of this company
    const followers = await FollowCompany.find({ companyId: companyId }).select('candidateId').lean(); // Only need candidateId
    
    if (followers.length === 0) return;

    // Create notifications for all followers
    const notifications = followers.map(f => ({
      candidateId: f.candidateId,
      type: "new_job",
      title: "New Job Posted!",
      message: `${companyName} just posted a new job: ${jobTitle}`,
      link: `/job/detail/${jobSlug}`,
      read: false,
      data: {
        companyId: companyId,
        companyName: companyName,
        jobId: jobId,
        jobTitle: jobTitle
      }
    }));

    await Notification.insertMany(notifications);

    // Send email notifications to followers (best-effort)
    const followerIds = followers.map(f => f.candidateId);
    const followerAccounts = await AccountCandidate.find({ _id: { $in: followerIds } })
      .select("email")
      .lean();
    const emails = followerAccounts
      .map((c: any) => c.email)
      .filter((e: any) => typeof e === "string" && e.trim().length > 0);

    if (emails.length > 0) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3069";
      const jobUrl = `${frontendUrl}/job/detail/${jobSlug}`;
      const subject = `New job from ${companyName}: ${jobTitle}`;
      const html = `
        <h2>New Job Posted!</h2>
        <p><strong>${companyName}</strong> just posted a new job: <strong>${jobTitle}</strong>.</p>
        <p><a href="${jobUrl}">View job details</a></p>
      `;
      for (const email of emails) {
        queueEmail(email, subject, html);
      }
    }

    // Auto-delete old notifications (keep only maxStored per candidate) - Bulk approach
    const candidateIds = followers.map(f => f.candidateId);
    
    // Find all notifications that exceed the limit for each candidate
    const notificationsToDelete = await Notification.aggregate([
      { $match: { candidateId: { $in: candidateIds } } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$candidateId",
          notifications: { $push: "$_id" }
        }
      },
      {
        $project: {
          toDelete: { $slice: ["$notifications", notificationConfig.maxStored, 1000] }
        }
      }
    ]);

    // Flatten all IDs to delete
    const idsToDelete = notificationsToDelete.flatMap(n => n.toDelete);
    
    if (idsToDelete.length > 0) {
      await Notification.deleteMany({ _id: { $in: idsToDelete } });
    }
  } catch (error) {
    console.error("[Job] Failed to send follower notifications:", error);
  }
}

export const createJobPost = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

  req.body.companyId = companyId;
  req.body.salaryMin = req.body.salaryMin ? parseInt(req.body.salaryMin) : 0;
  req.body.salaryMax = req.body.salaryMax ? parseInt(req.body.salaryMax) : 0;
  req.body.maxApplications = req.body.maxApplications ? parseInt(req.body.maxApplications) : 0;
  req.body.maxApproved = req.body.maxApproved ? parseInt(req.body.maxApproved) : 0;
  
  // Parse expiration date (optional)
  if (req.body.expirationDate && req.body.expirationDate !== '') {
    req.body.expirationDate = new Date(req.body.expirationDate);
  } else {
    req.body.expirationDate = null;
  }
  
  req.body.technologies = normalizeTechnologies(req.body.technologies);
    // Generate technologySlugs from normalized technologies
    req.body.technologySlugs = req.body.technologies.map((t: string) => normalizeTechnologyKey(t));
    req.body.images = [];
    
    // Parse cities from JSON string
    if (req.body.cities && typeof req.body.cities === 'string') {
      try {
        req.body.cities = JSON.parse(req.body.cities);
      } catch (err) {
        console.warn("[Job] Failed to parse cities payload for create");
        req.body.cities = [];
      }
    }


    if (req.files) {
      const seen = new Set<string>();
      for (const file of req.files as any[]) {
        const path = file.path;
        if (!seen.has(path)) {
          seen.add(path);
          req.body.images.push(path);
        }
      }
    }
    
    const newRecord = new Job(req.body);
    await newRecord.save();

    // Generate slug after save to get the ID
    newRecord.slug = generateUniqueSlug(req.body.title, newRecord.id);
    await newRecord.save();

    // Invalidate caches that depend on job data
    cache.del(["job_technologies", "top_cities", "top_companies"]);
    await cache.delPrefix(["company_list:", "search:"]);

    // Send notifications to followers (async, don't wait)
    sendJobNotificationsToFollowers(companyId, req.account.companyName, newRecord.id, req.body.title, newRecord.slug);
  
    res.json({
      code: "success",
      message: "Job created!"
    })
  } catch (error) {
    console.error("[Job] createJobPost failed:", error);
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const getJobList = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    const find = {
      companyId: companyId
    };

    // Pagination
    const limitItems = paginationConfig.companyJobList;
    let page = 1;
    if(req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const skip = (page - 1) * limitItems;
    
    // Execute count and find in parallel
    const [totalRecord, jobList] = await Promise.all([
      Job.countDocuments(find),
      // Select only needed fields
      Job.find(find)
        .select('title slug salaryMin salaryMax position workingForm technologies technologySlugs cities images maxApplications maxApproved applicationCount approvedCount viewCount expirationDate createdAt')
        .sort({ createdAt: "desc" })
        .limit(limitItems)
        .skip(skip)
        .lean()
    ]);
    const totalPage = Math.ceil(totalRecord/limitItems);
    // End Pagination

    const dataFinal = [];

    // Bulk fetch all job cities (1 query instead of N)
    const allCityIds = [...new Set(
      jobList.flatMap(j => (j.cities || []) as any[])
        .map((id: any) => id?.toString?.() || id)
        .filter((id: any) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
    )];
    // Select only name field
    const cities = allCityIds.length > 0 
      ? await City.find({ _id: { $in: allCityIds } }).select('name').lean() 
      : [];
    const cityMap = new Map(cities.map((c: any) => [c._id.toString(), c.name]));

    for (const item of jobList) {
      const technologySlugs = (item.technologies || []).map((t: string) => normalizeTechnologyKey(t));
      
      // Resolve job cities to names from map
      const jobCityNames = ((item.cities || []) as any[])
        .map(cityId => cityMap.get(cityId?.toString?.() || cityId))
        .filter(Boolean) as string[];
      
      const itemFinal = {
        id: item._id,
        title: item.title,
        slug: item.slug,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        position: item.position,
        workingForm: item.workingForm,
        technologies: item.technologies,
        technologySlugs: technologySlugs,
        jobCities: jobCityNames,
        maxApplications: item.maxApplications || 0,
        applicationCount: item.applicationCount || 0,
        maxApproved: item.maxApproved || 0,
        approvedCount: item.approvedCount || 0,
      };

      dataFinal.push(itemFinal);
    }
  
    res.json({
      code: "success",
      message: "Success!",
      jobList: dataFinal,
      totalPage: totalPage
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const getJobEdit = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const companyId = req.account.id;
    const jobId = req.params.id;

    // Validate ObjectId format
    if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
      res.json({
        code: "error",
        message: "Job not found!"
      });
      return;
    }

    const jobDetail = await Job.findOne({
      _id: jobId,
      companyId: companyId
    }).select('title description address salaryMin salaryMax position workingForm cities technologies keyword benefit requirement expirationDate maxApplications maxApproved images') // All editable fields

    if(!jobDetail) {
      res.json({
        code: "error",
        message: "Job not found!"
      })
      return;
    }

    // Add technologySlugs to job detail
    const technologySlugs = (jobDetail.technologies || []).map((t: string) => normalizeTechnologyKey(t));
  
    res.json({
      code: "success",
      message: "Success!",
      jobDetail: {
        ...jobDetail.toObject(),
        images: jobDetail.images || [],
        technologySlugs: technologySlugs
      }
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const jobEditPatch = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const companyId = req.account.id;
    const jobId = req.params.id;

    // Validate ObjectId format
    if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
      res.json({ code: "error", message: "Job not found!" });
      return;
    }

    // Fetch full job to support merge updates
    const jobDetail = await Job.findOne({
      _id: jobId,
      companyId: companyId
    }).select('title salaryMin salaryMax position workingForm technologies technologySlugs cities description images maxApplications maxApproved expirationDate');

    if(!jobDetail) {
      res.json({
        code: "error",
        message: "Job not found!"
      })
      return;
    }

    const updateData: any = {};

    if (req.body.title !== undefined) {
      updateData.title = req.body.title;
    }
    if (req.body.salaryMin !== undefined) {
      updateData.salaryMin = parseInt(req.body.salaryMin) || 0;
    }
    if (req.body.salaryMax !== undefined) {
      updateData.salaryMax = parseInt(req.body.salaryMax) || 0;
    }
    if (req.body.maxApplications !== undefined) {
      updateData.maxApplications = parseInt(req.body.maxApplications) || 0;
    }
    if (req.body.maxApproved !== undefined) {
      updateData.maxApproved = parseInt(req.body.maxApproved) || 0;
    }
    if (req.body.position !== undefined) {
      updateData.position = req.body.position;
    }
    if (req.body.workingForm !== undefined) {
      updateData.workingForm = req.body.workingForm;
    }
    if (req.body.description !== undefined) {
      updateData.description = req.body.description;
    }

    // Parse expiration date (optional)
    if (req.body.expirationDate !== undefined) {
      if (req.body.expirationDate && req.body.expirationDate !== '') {
        updateData.expirationDate = new Date(req.body.expirationDate);
      } else {
        updateData.expirationDate = null;
      }
    }

    if (req.body.technologies !== undefined) {
      updateData.technologies = normalizeTechnologies(req.body.technologies);
      updateData.technologySlugs = updateData.technologies.map((t: string) => normalizeTechnologyKey(t));
    }

    // Parse cities from JSON string
    if (req.body.cities !== undefined) {
      if (req.body.cities && typeof req.body.cities === 'string') {
        try {
          updateData.cities = JSON.parse(req.body.cities);
        } catch (err) {
          console.warn("[Job] Failed to parse cities payload for edit");
          updateData.cities = [];
        }
      } else {
        updateData.cities = req.body.cities;
      }
    }


    // Merge images: existing + newly uploaded, or keep current if none provided
    const uniqueOrdered = (images: string[]) => {
      const seen = new Set<string>();
      const result: string[] = [];
      for (const img of images) {
        if (!seen.has(img)) {
          seen.add(img);
          result.push(img);
        }
      }
      return result;
    };

    const oldImages = (jobDetail.images || []) as string[];
    let mergedImages: string[] | null = null;
    if (req.body.existingImages !== undefined || (req.files && (req.files as any[]).length > 0)) {
      let existingImages: string[] = [];
      if (req.body.existingImages && typeof req.body.existingImages === 'string') {
        try {
          const existing = JSON.parse(req.body.existingImages);
          if (Array.isArray(existing)) {
            existingImages = existing;
          }
        } catch (err) {
          console.warn("[Job] Failed to parse existingImages payload");
          existingImages = [];
        }
      }
      const newImages: string[] = [];
      if (req.files) {
        for (const file of req.files as any[]) {
          newImages.push(file.path);
        }
      }
      mergedImages = uniqueOrdered([...existingImages, ...newImages]);
    }

    if (mergedImages) {
      updateData.images = mergedImages;
    }

    // Update slug if title changed
    if (updateData.title && updateData.title !== jobDetail.title) {
      updateData.slug = generateUniqueSlug(updateData.title, jobId);
    }

    await Job.updateOne({
      _id: jobId,
      companyId: companyId
    }, updateData);

    // Delete removed images from Cloudinary when editing image list
    if (mergedImages) {
      const removedImages = oldImages.filter((url) => !mergedImages!.includes(url));
      await deleteImages(removedImages as string[]);
    }

    // Invalidate caches after job update
    cache.del(["job_technologies", "top_cities", "top_companies"]);
    await cache.delPrefix(["company_list:", "search:"]);
  
    res.json({
      code: "success",
      message: "Update successful!"
    })
  } catch (error) {
    console.error("[Job] jobEditPatch failed:", error);
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const deleteJobDel = async (req: RequestAccount<{ id: string }>, res: Response) => {
  try {
    const companyId = req.account.id;
    const jobId = req.params.id;

    // Validate ObjectId format
    if (!jobId || !/^[a-fA-F0-9]{24}$/.test(jobId)) {
      res.json({ code: "error", message: "Job not found!" });
      return;
    }

    const jobDetail = await Job.findOne({
      _id: jobId,
      companyId: companyId
    }).select('images') // Only need images for cleanup

    if(!jobDetail) {
      res.json({
        code: "error",
        message: "Job not found!"
      })
      return;
    }

    // Delete images from Cloudinary if any
    if (jobDetail.images && Array.isArray(jobDetail.images)) {
      await deleteImages(jobDetail.images as string[]);
    }

    // Cascade delete: Delete all CVs/applications for this job
    // Select only fileCV field
    const cvList = await CV.find({ jobId: jobId }).select('fileCV').lean();
    const cvFiles = cvList.map((cv) => cv.fileCV as string).filter(Boolean);
    await deleteImages(cvFiles);
    await CV.deleteMany({ jobId: jobId });

    // Delete view tracking records for this job
    await JobView.deleteMany({ jobId: jobId });

    await Job.deleteOne({
      _id: jobId,
      companyId: companyId
    });

    // Invalidate caches after job deletion
    cache.del(["job_technologies", "top_cities", "top_companies"]);
    await cache.delPrefix(["company_list:", "search:"]);
  
    res.json({
      code: "success",
      message: "Job deleted!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}
