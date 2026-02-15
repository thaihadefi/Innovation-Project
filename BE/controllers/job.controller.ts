import { Response } from "express";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import Location from "../models/location.model";
import CV from "../models/cv.model";
import { RequestAccount } from "../interfaces/request.interface";
import { normalizeSkillName, normalizeSkillKey } from "../helpers/skill.helper";
import cache, { CACHE_TTL } from "../helpers/cache.helper";
import { notifyCompany } from "../helpers/socket.helper";
import Notification from "../models/notification.model";
import AccountCandidate from "../models/account-candidate.model";
import JobView from "../models/job-view.model";
import { invalidateJobDiscoveryCaches } from "../helpers/cache-invalidation.helper";
import { discoveryConfig } from "../config/variable";

export const skills = async (req: RequestAccount, res: Response) => {
  try {
    const cacheKey = "job_skills";
    const cached = await cache.getAsync(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const allJobs = await Job.find({})
      .select('skills skillSlugs')
      .lean();
    
    const techCount: { [slug: string]: { name: string; count: number } } = {};

    allJobs.forEach(job => {
      if (job.skills && Array.isArray(job.skills)) {
        (job.skills as string[]).forEach(rawTech => {
          const name = normalizeSkillName(rawTech);
          if (!name) return;
          const slug = normalizeSkillKey(name);
          if (techCount[slug]) {
            techCount[slug].count += 1;
          } else {
            techCount[slug] = { name, count: 1 };
          }
        });
      }
    });
    
    const skillsWithCount = Object.entries(techCount)
      .map(([slug, info]) => ({ name: info.name, count: info.count, slug }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return a.name.localeCompare(b.name);
      });
    
    const allSkills = skillsWithCount
      .map(item => item.name)
      .sort();

    const skillsWithSlug = skillsWithCount
      .map(item => ({ name: item.name, slug: item.slug }))
      .sort((a, b) => a.name.localeCompare(b.name));

    const response = {
      code: "success",
      skills: allSkills,
      skillsWithSlug: skillsWithSlug,
      topSkills: skillsWithCount.slice(0, discoveryConfig.topSkills)
    };

    cache.set(cacheKey, response, CACHE_TTL.STATIC);

    res.json(response);
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed to fetch skills"
    });
  }
}

export const detail = async (req: RequestAccount, res: Response) => {
  try {
    const slug = req.params.slug;

    const jobInfo = await Job.findOne({ slug: slug })
      .select('companyId title slug salaryMin salaryMax position workingForm skills skillSlugs locations description images maxApplications maxApproved applicationCount approvedCount viewCount expirationDate')
      .lean();

    if(!jobInfo) {
      res.status(404).json({
        code: "error",
        message: "Failed."
      })
      return;
    }

    const viewerId = req.account?._id?.toString() || null;
    const isOwnerViewing = viewerId && viewerId === jobInfo.companyId?.toString();
    
    if (!isOwnerViewing) {
      const today = new Date().toISOString().split('T')[0];
      const fingerprint = req.ip || req.headers['x-forwarded-for'] || 'unknown';
      
      try {
        await JobView.create({
          jobId: jobInfo._id,
          viewerId: viewerId,
          fingerprint: viewerId ? null : String(fingerprint),
          viewDate: today
        });
        
        Job.updateOne({ _id: jobInfo._id }, { $inc: { viewCount: 1 } }).exec();
      } catch (error: any) {
        if (error?.code === 11000) {
          return;
        }
        console.warn("[Job] Failed to record unique view:", error);
      }
    }

    const validCityIds = (jobInfo.locations as string[] || []).filter(id => 
      typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
    );
    
    const [companyInfo, jobLocations] = await Promise.all([
      AccountCompany.findOne({ _id: jobInfo.companyId })
        .select('companyName slug logo location address companyModel companyEmployees workingTime workOverTime')
        .lean(),
      validCityIds.length > 0 
        ? Location.find({ _id: { $in: validCityIds } }).select('name slug').lean() 
        : Promise.resolve([])
    ]);

    if(!companyInfo) {
      res.status(404).json({
        code: "error",
        message: "Failed."
      })
      return;
    }

    const locationInfo = await Location.findOne({ _id: companyInfo.location })
      .select('name slug')
      .lean();
    const jobCityNames = jobLocations.map((c: any) => c.name);

    const maxApproved = jobInfo.maxApproved || 0;
    const approvedCount = jobInfo.approvedCount || 0;
    const isFull = maxApproved > 0 && approvedCount >= maxApproved;

    const isExpired = jobInfo.expirationDate 
      ? new Date(jobInfo.expirationDate) < new Date() 
      : false;

    const jobDetail = {
      id: jobInfo._id?.toString(),
      title: jobInfo.title,
      slug: jobInfo.slug,
      companyName: companyInfo.companyName,
      companySlug: companyInfo.slug,
      salaryMin: jobInfo.salaryMin,
      salaryMax: jobInfo.salaryMax,
      images: Array.from(new Set(jobInfo.images || [])),
      position: jobInfo.position,
      workingForm: jobInfo.workingForm,
      companyLocation: locationInfo?.name || "",
      companyLocationSlug: locationInfo?.slug || "",
      jobLocations: jobCityNames,
      address: companyInfo.address,
      skills: jobInfo.skills,
      skillSlugs: jobInfo.skillSlugs || [],
      description: jobInfo.description,
      companyLogo: companyInfo.logo,
      companyId: companyInfo._id?.toString(),
      companyModel: companyInfo.companyModel,
      companyEmployees: companyInfo.companyEmployees,
      workingTime: companyInfo.workingTime,
      workOverTime: companyInfo.workOverTime,
      isFull: isFull,
      isExpired: isExpired,
      expirationDate: jobInfo.expirationDate || null,
      maxApplications: jobInfo.maxApplications || 0,
      maxApproved: maxApproved,
      applicationCount: jobInfo.applicationCount || 0,
      approvedCount: approvedCount
    };

    res.json({
      code: "success",
      message: "Success.",
      jobDetail: jobDetail
    })
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "Failed."
    })
  }
}

export const applyPost = async (req: RequestAccount, res: Response) => {
  try {
    const email = req.account.email;

    if (!req.account.isVerified) {
      res.status(403).json({
        code: "error",
        message: "Only verified UIT students and alumni can apply for jobs. Please update your MSSV in your profile."
      })
      return;
    }

    const phoneRegex = /^(84|0[35789])[0-9]{8}$/;
    if (!phoneRegex.test(req.body.phone)) {
      res.status(400).json({
        code: "error",
        message: "Invalid phone number! Please use Vietnamese format (e.g., 0912345678)"
      })
      return;
    }

    const job = await Job.findById(req.body.jobId)
      .select('maxApplications applicationCount maxApproved approvedCount expirationDate companyId title')
      .lean();
      
    if (!job) {
      res.status(404).json({
        code: "error",
        message: "Job not found."
      })
      return;
    }

    if (job.maxApplications && job.maxApplications > 0) {
      if ((job.applicationCount || 0) >= job.maxApplications) {
        res.status(409).json({
          code: "error",
          message: "This position has reached maximum applications."
        })
        return;
      }
    }

    if (job.maxApproved && job.maxApproved > 0) {
      if ((job.approvedCount || 0) >= job.maxApproved) {
        res.status(409).json({
          code: "error",
          message: "This position is no longer accepting applications."
        })
        return;
      }
    }

    if (job.expirationDate && new Date(job.expirationDate) < new Date()) {
      res.status(410).json({
        code: "error",
        message: "This job posting has expired."
      })
      return;
    }

    const existCV = await CV.findOne({
      jobId: req.body.jobId,
      email: email
    }).select('_id').lean();

    if(existCV) {
      res.status(409).json({
        code: "error",
        message: "You have already applied for this job."
      })
      return;
    }

    const now = new Date();
    const reserveResult = await Job.updateOne(
      {
        _id: req.body.jobId,
        $and: [
          {
            $or: [
              { expirationDate: null },
              { expirationDate: { $exists: false } },
              { expirationDate: { $gt: now } }
            ]
          },
          {
            $or: [
              { maxApplications: { $exists: false } },
              { maxApplications: 0 },
              { $expr: { $lt: ["$applicationCount", "$maxApplications"] } }
            ]
          },
          {
            $or: [
              { maxApproved: { $exists: false } },
              { maxApproved: 0 },
              { $expr: { $lt: ["$approvedCount", "$maxApproved"] } }
            ]
          }
        ]
      },
      { $inc: { applicationCount: 1 } }
    );

    if (reserveResult.matchedCount === 0) {
      res.status(409).json({
        code: "error",
        message: "This position is no longer accepting applications."
      });
      return;
    }

    const newRecord = new CV({
      jobId: req.body.jobId,
      fullName: req.body.fullName,
      email: email,
      phone: req.body.phone,
      fileCV: req.file ? req.file.path : "",
    });
    try {
      await newRecord.save();
    } catch (err: any) {
      await Job.updateOne(
        { _id: req.body.jobId },
        { $inc: { applicationCount: -1 } }
      );
      if (err && err.code === 11000) {
        res.status(409).json({
          code: "error",
          message: "You have already applied for this job."
        });
        return;
      }
      throw err;
    }

    await invalidateJobDiscoveryCaches();

    try {
      if (job) {
        const newNotif = await Notification.create({
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
        
        if (job.companyId) {
          notifyCompany(job.companyId.toString(), newNotif);
        }

        const updatedJob = await Job.findById(req.body.jobId)
          .select('maxApplications applicationCount title slug companyId')
          .lean();
        if (updatedJob && updatedJob.maxApplications > 0 && 
            (updatedJob.applicationCount || 0) >= updatedJob.maxApplications) {
          const limitNotif = await Notification.create({
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
          
          if (job.companyId) {
            notifyCompany(job.companyId.toString(), limitNotif);
          }
        }

        const company = await AccountCompany.findById(job.companyId)
          .select('email')
          .lean();
        if (company?.email) {
          const { queueEmail } = await import("../helpers/mail.helper");
          const emailSubject = `New Application for ${job.title}`;
          const emailContent = `
            <h2>New Application Received!</h2>
            <p><strong>${req.body.fullName}</strong> has applied for the position <strong>${job.title}</strong>.</p>
            <p>View the application: <a href="${process.env.FRONTEND_URL || 'http://localhost:3069'}/company-manage/cv/detail/${newRecord.id}">Click here</a></p>
          `;
          queueEmail(company.email, emailSubject, emailContent);
        }
      }
    } catch (err) {
      console.log("[Job] Failed to send post-apply notifications:", err);
    }

    res.json({
      code: "success",
      message: "CV submitted successfully."
    })
  } catch (error) {
    res.status(500).json({
      code: "error",
      message: "CV submission failed."
    })
  }
}

export const checkApplied = async (req: RequestAccount, res: Response) => {
  try {
    const jobId = req.params.jobId;

    if (req.accountType === "company" && req.account) {
      const jobInfo = await Job.findOne({ _id: jobId })
        .select('companyId')
        .lean();
      if (jobInfo && jobInfo.companyId?.toString() === req.account.id.toString()) {
        res.json({
          code: "company",
          applied: false
        });
        return;
      }
      res.json({
        code: "company_other",
        applied: false
      });
      return;
    }

    if (req.accountType === "guest" || !req.account) {
      res.json({
        code: "guest",
        applied: false
      });
      return;
    }

    const email = req.account.email;
    const existCV = await CV.findOne({
      jobId: jobId,
      email: email
    }).select('_id status').lean();

    res.json({
      code: "success",
      applied: !!existCV,
      applicationId: existCV ? existCV._id?.toString() : null,
      applicationStatus: existCV ? existCV.status : null,
      isVerified: req.account.isVerified || false
    });
  } catch (error) {
    res.status(500).json({
      code: "error",
      applied: false
    });
  }
}
