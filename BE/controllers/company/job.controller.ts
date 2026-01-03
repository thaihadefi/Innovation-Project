import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import Job from "../../models/job.model";
import City from "../../models/city.model";
import CV from "../../models/cv.model";
import FollowCompany from "../../models/follow-company.model";
import Notification from "../../models/notification.model";
import JobView from "../../models/job-view.model";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { generateUniqueSlug, convertToSlug } from "../../helpers/slugify.helper";
import { normalizeTechnologies, normalizeTechnologyName } from "../../helpers/technology.helper";
import cache, { CACHE_TTL } from "../../helpers/cache.helper";
import { notificationConfig, paginationConfig } from "../../config/variable";

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
    const followers = await FollowCompany.find({ companyId: companyId });
    
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
    req.body.technologySlugs = req.body.technologies.map((t: string) => convertToSlug(t));
    req.body.images = [];
    
    // Parse cities from JSON string
    if (req.body.cities && typeof req.body.cities === 'string') {
      try {
        req.body.cities = JSON.parse(req.body.cities);
      } catch {
        req.body.cities = [];
      }
    }

    if(req.files) {
      for (const file of req.files as any[]) {
        req.body.images.push(file.path);
      }
    }
    
    const newRecord = new Job(req.body);
    await newRecord.save();

    // Generate slug after save to get the ID
    newRecord.slug = generateUniqueSlug(req.body.title, newRecord.id);
    await newRecord.save();

    // Invalidate caches that depend on job data
    cache.del(["job_technologies", "top_cities", "top_companies"]);

    // Send notifications to followers (async, don't wait)
    sendJobNotificationsToFollowers(companyId, req.account.companyName, newRecord.id, req.body.title, newRecord.slug);
  
    res.json({
      code: "success",
      message: "Job created!"
    })
  } catch (error) {
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
    const totalRecord = await Job.countDocuments(find);
    const totalPage = Math.ceil(totalRecord/limitItems);
    // End Pagination

    const jobList = await Job
      .find(find)
      .sort({
        createdAt: "desc"
      })
      .limit(limitItems)
      .skip(skip);

    const dataFinal = [];

    // Bulk fetch all job cities (1 query instead of N)
    const allCityIds = [...new Set(
      jobList.flatMap(j => (j.cities || []) as string[])
        .filter((id: string) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
    )];
    const cities = allCityIds.length > 0 ? await City.find({ _id: { $in: allCityIds } }) : [];
    const cityMap = new Map(cities.map((c: any) => [c._id.toString(), c.name]));

    for (const item of jobList) {
      const technologySlugs = (item.technologies || []).map((t: string) => convertToSlug(normalizeTechnologyName(t)));
      
      // Resolve job cities to names from map
      const jobCityNames = ((item.cities || []) as string[])
        .map(cityId => cityMap.get(cityId?.toString()))
        .filter(Boolean) as string[];
      
      const itemFinal = {
        id: item.id,
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

export const getJobEdit = async (req: RequestAccount, res: Response) => {
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
    })

    if(!jobDetail) {
      res.json({
        code: "error",
        message: "Job not found!"
      })
      return;
    }

    // Add technologySlugs to job detail
    const technologySlugs = (jobDetail.technologies || []).map((t: string) => convertToSlug(normalizeTechnologyName(t)));
  
    res.json({
      code: "success",
      message: "Success!",
      jobDetail: {
        ...jobDetail.toObject(),
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

export const jobEditPatch = async (req: RequestAccount, res: Response) => {
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
    })

    if(!jobDetail) {
      res.json({
        code: "error",
        message: "Job not found!"
      })
      return;
    }

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
    // Regenerate technologySlugs when technologies are updated
    req.body.technologySlugs = req.body.technologies.map((t: string) => convertToSlug(t));
    req.body.images = [];
    
    // Parse and keep existing images that weren't deleted
    if (req.body.existingImages && typeof req.body.existingImages === 'string') {
      try {
        const existing = JSON.parse(req.body.existingImages);
        if (Array.isArray(existing)) {
          req.body.images = existing;
        }
      } catch {
        // Invalid JSON, ignore
      }
    }
    
    // Parse cities from JSON string
    if (req.body.cities && typeof req.body.cities === 'string') {
      try {
        req.body.cities = JSON.parse(req.body.cities);
      } catch {
        req.body.cities = [];
      }
    }

    // Append new uploaded images
    if(req.files) {
      for (const file of req.files as any[]) {
        req.body.images.push(file.path);
      }
    }

    // Update slug if title changed
    if(req.body.title && req.body.title !== jobDetail.title) {
      req.body.slug = generateUniqueSlug(req.body.title, jobId);
    }

    await Job.updateOne({
      _id: jobId,
      companyId: companyId
    }, req.body);

    // Invalidate caches after job update
    cache.del(["job_technologies", "top_cities", "top_companies"]);
  
    res.json({
      code: "success",
      message: "Update successful!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const deleteJobDel = async (req: RequestAccount, res: Response) => {
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
    })

    if(!jobDetail) {
      res.json({
        code: "error",
        message: "Job not found!"
      })
      return;
    }

    // Delete images from Cloudinary if any
    if (jobDetail.images && Array.isArray(jobDetail.images)) {
      for (const imageUrl of jobDetail.images) {
        await deleteImage(imageUrl as string);
      }
    }

    // Cascade delete: Delete all CVs/applications for this job
    const cvList = await CV.find({ jobId: jobId });
    for (const cv of cvList) {
      // Delete CV file from Cloudinary
      if (cv.fileCV) {
        await deleteImage(cv.fileCV as string);
      }
    }
    await CV.deleteMany({ jobId: jobId });

    // Delete view tracking records for this job
    await JobView.deleteMany({ jobId: jobId });

    await Job.deleteOne({
      _id: jobId,
      companyId: companyId
    });

    // Invalidate caches after job deletion
    cache.del(["job_technologies", "top_cities", "top_companies"]);
  
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
