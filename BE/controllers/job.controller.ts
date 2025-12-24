import { Response } from "express";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import City from "../models/city.model";
import CV from "../models/cv.model";
import { RequestAccount } from "../interfaces/request.interface";
import { normalizeTechnologyName } from "../helpers/technology.helper";
import { convertToSlug } from "../helpers/slugify.helper";
import cache from "../helpers/cache.helper";
import Notification from "../models/notification.model";
import AccountCandidate from "../models/account-candidate.model";

export const technologies = async (req: RequestAccount, res: Response) => {
  try {
    // Check cache first
    const cacheKey = "job_technologies";
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const allJobs = await Job.find({});
    
    // Count how many jobs use each technology.
    // Use normalized names and a slug key so we group variants like extra spaces or different casing.
    const techCount: { [slug: string]: { name: string; count: number } } = {};

    allJobs.forEach(job => {
      if (job.technologies && Array.isArray(job.technologies)) {
        (job.technologies as string[]).forEach(rawTech => {
          const name = normalizeTechnologyName(rawTech);
          if (!name) return;
          const slug = convertToSlug(name);
          if (techCount[slug]) {
            techCount[slug].count += 1;
          } else {
            techCount[slug] = { name, count: 1 };
          }
        });
      }
    });
    
    // Convert to array with counts and sort by count (descending), then alphabetically
    const technologiesWithCount = Object.entries(techCount)
      .map(([slug, info]) => ({ name: info.name, count: info.count, slug }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count; // Sort by count descending
        return a.name.localeCompare(b.name); // Then alphabetically
      });
    
    // Also provide simple array sorted alphabetically for dropdown
    const allTechnologies = technologiesWithCount
      .map(item => item.name)
      .sort();

    // Provide a slugified version for each technology for robust client usage
    const technologiesWithSlug = technologiesWithCount
      .map(item => ({ name: item.name, slug: item.slug }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const response = {
      code: "success",
      technologies: allTechnologies, // All technologies sorted alphabetically (backward compatible)
      technologiesWithSlug: technologiesWithSlug, // New: objects with name+slug
      topTechnologies: technologiesWithCount.slice(0, 5) // Top 5 by popularity (each has name,count,slug)
    };

    // Cache the response for 5 minutes
    cache.set(cacheKey, response, 300);

    res.json(response);
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to fetch technologies"
    });
  }
}

export const detail = async (req: RequestAccount, res: Response) => {
  try {
    const slug = req.params.slug;

    const jobInfo = await Job.findOne({
      slug: slug
    })

    if(!jobInfo) {
      res.json({
        code: "error",
        message: "Failed!"
      })
      return;
    }

    const companyInfo = await AccountCompany.findOne({
      _id: jobInfo.companyId
    })

    if(!companyInfo) {
      res.json({
        code: "error",
        message: "Failed!"
      })
      return;
    }

    // City is optional
    const cityInfo = await City.findOne({
      _id: companyInfo.city
    })

    // Resolve job cities to names (with error handling)
    let jobCityNames: string[] = [];
    try {
      if (jobInfo.cities && Array.isArray(jobInfo.cities) && (jobInfo.cities as string[]).length > 0) {
        const validCityIds = (jobInfo.cities as string[]).filter(id => 
          typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
        );
        if (validCityIds.length > 0) {
          const jobCities = await City.find({ _id: { $in: validCityIds } });
          jobCityNames = jobCities.map((c: any) => c.name);
        }
      }
    } catch {
      jobCityNames = [];
    }

    // Check if job is full
    const maxApproved = jobInfo.maxApproved || 0;
    const approvedCount = jobInfo.approvedCount || 0;
    const isFull = maxApproved > 0 && approvedCount >= maxApproved;

    const jobDetail = {
      id: jobInfo.id,
      title: jobInfo.title,
      slug: jobInfo.slug,
      companyName: companyInfo.companyName,
      companySlug: companyInfo.slug,
      salaryMin: jobInfo.salaryMin,
      salaryMax: jobInfo.salaryMax,
      images: jobInfo.images,
      position: jobInfo.position,
      workingForm: jobInfo.workingForm,
      companyCity: cityInfo?.name || "",
      companyCitySlug: cityInfo?.slug || "",
      jobCities: jobCityNames,
      address: companyInfo.address,
      technologies: jobInfo.technologies,
      technologySlugs: jobInfo.technologySlugs || [], // Use persisted slugs from DB
      description: jobInfo.description,
      companyLogo: companyInfo.logo,
      companyId: companyInfo.id,
      companyModel: companyInfo.companyModel,
      companyEmployees: companyInfo.companyEmployees,
      workingTime: companyInfo.workingTime,
      workOverTime: companyInfo.workOverTime,
      isFull: isFull,
      // Application stats for transparency
      maxApplications: jobInfo.maxApplications || 0,
      maxApproved: maxApproved,
      applicationCount: jobInfo.applicationCount || 0,
      approvedCount: approvedCount
    };

    res.json({
      code: "success",
      message: "Success!",
      jobDetail: jobDetail
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    })
  }
}

export const applyPost = async (req: RequestAccount, res: Response) => {
  try {
    // Use logged-in account email instead of form email
    const email = req.account.email;

    // Check if candidate is verified (UIT student)
    if (!req.account.isVerified) {
      res.json({
        code: "error",
        message: "Only verified UIT students can apply for jobs. Please update your MSSV in your profile."
      })
      return;
    }

    // Validate phone number (Vietnamese format)
    const phoneRegex = /^(84|0[35789])[0-9]{8}$/;
    if (!phoneRegex.test(req.body.phone)) {
      res.json({
        code: "error",
        message: "Invalid phone number! Please use Vietnamese format (e.g., 0912345678)"
      })
      return;
    }

    // Check if job exists and has available slots
    const job = await Job.findById(req.body.jobId);
    if (!job) {
      res.json({
        code: "error",
        message: "Job not found!"
      })
      return;
    }

    // Check if applications are full (0 = unlimited)
    if (job.maxApplications && job.maxApplications > 0) {
      if ((job.applicationCount || 0) >= job.maxApplications) {
        res.json({
          code: "error",
          message: "This position has reached maximum applications!"
        })
        return;
      }
    }

    // Check if approved slots are full (0 = unlimited)
    if (job.maxApproved && job.maxApproved > 0) {
      if ((job.approvedCount || 0) >= job.maxApproved) {
        res.json({
          code: "error",
          message: "This position is no longer accepting applications!"
        })
        return;
      }
    }

    const existCV = await CV.findOne({
      jobId: req.body.jobId,
      email: email
    })

    if(existCV) {
      res.json({
        code: "error",
        message: "You have already applied for this job!"
      })
      return;
    }

    const newRecord = new CV({
      jobId: req.body.jobId,
      fullName: req.body.fullName,
      email: email, // Use account email
      phone: req.body.phone,
      fileCV: req.file ? req.file.path : "",
    });
    await newRecord.save();

    // Atomic increment applicationCount
    await Job.updateOne(
      { _id: req.body.jobId },
      { $inc: { applicationCount: 1 } }
    );

    // Notify company about new application
    try {
      const job = await Job.findById(req.body.jobId);
      if (job) {
        await Notification.create({
          companyId: job.companyId,
          type: "application_received",
          title: "New Application!",
          message: `${req.body.fullName} applied for ${job.title}`,
          link: `/company-manage/cv/detail/${newRecord.id}`,
          read: false,
          data: {
            jobId: job._id,
            jobTitle: job.title,
            cvId: newRecord._id,
            applicantName: req.body.fullName
          }
        });

        // Check if job has reached max applications limit
        const updatedJob = await Job.findById(req.body.jobId);
        if (updatedJob && updatedJob.maxApplications > 0 && 
            (updatedJob.applicationCount || 0) >= updatedJob.maxApplications) {
          await Notification.create({
            companyId: job.companyId,
            type: "applications_limit_reached",
            title: "Application Limit Reached!",
            message: `Your job "${job.title}" has reached the maximum number of applications (${updatedJob.maxApplications}). Consider closing the job or increasing the limit.`,
            link: `/company-manage/job/edit/${job.slug}`,
            read: false,
            data: {
              jobId: job._id,
              jobTitle: job.title,
              jobSlug: job.slug
            }
          });
        }
      }
    } catch (err) {
      console.log("Failed to send notification:", err);
    }

    res.json({
      code: "success",
      message: "CV submitted successfully!"
    })
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "CV submission failed!"
    })
  }
}

// Check if candidate already applied to a job
export const checkApplied = async (req: RequestAccount, res: Response) => {
  try {
    const jobId = req.params.jobId;

    // Company viewing - check if they own this job
    if (req.accountType === "company" && req.account) {
      const jobInfo = await Job.findOne({ _id: jobId });
      if (jobInfo && jobInfo.companyId?.toString() === req.account.id.toString()) {
        // This is their own job
        res.json({
          code: "company",
          applied: false
        });
        return;
      }
      // Company viewing another company's job - treat as guest (can't apply)
      res.json({
        code: "company_other",
        applied: false
      });
      return;
    }

    // Guest user (not logged in)
    if (req.accountType === "guest" || !req.account) {
      res.json({
        code: "guest",
        applied: false
      });
      return;
    }

    // Candidate - check if already applied
    const email = req.account.email;
    const existCV = await CV.findOne({
      jobId: jobId,
      email: email
    });

    res.json({
      code: "success",
      applied: !!existCV,
      applicationId: existCV ? existCV.id : null,
      isVerified: req.account.isVerified || false
    });
  } catch (error) {
    res.json({
      code: "error",
      applied: false
    });
  }
}