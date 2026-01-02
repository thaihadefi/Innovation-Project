import { Request, Response } from "express";
import AccountCompany from "../models/account-company.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RequestAccount } from "../interfaces/request.interface";
import Job from "../models/job.model";
import City from "../models/city.model";
import CV from "../models/cv.model";
import ForgotPassword from "../models/forgot-password.model";
import { generateRandomNumber } from "../helpers/generate.helper";
import { queueEmail } from "../helpers/mail.helper";
import { deleteImage } from "../helpers/cloudinary.helper";
import { generateUniqueSlug, convertToSlug } from "../helpers/slugify.helper";
import { normalizeTechnologies, normalizeTechnologyName } from "../helpers/technology.helper";
import cache, { CACHE_TTL } from "../helpers/cache.helper";
import { notifyCandidate } from "../helpers/socket.helper";
import EmailChangeRequest from "../models/emailChangeRequest.model";
import AccountCandidate from "../models/account-candidate.model";
import FollowCompany from "../models/follow-company.model";
import Notification from "../models/notification.model";
import { notificationConfig, paginationConfig } from "../config/variable";
import JobView from "../models/job-view.model";

// Helper: Send notifications to followers when new job is posted
const sendJobNotificationsToFollowers = async (
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

    // Auto-delete old notifications (keep only 20 per candidate)
    for (const follower of followers) {
      const candidateNotifs = await Notification.find({ candidateId: follower.candidateId })
        .sort({ createdAt: -1 })
        .skip(notificationConfig.maxStored)
        .select("_id");
      
      if (candidateNotifs.length > 0) {
        const idsToDelete = candidateNotifs.map(n => n._id);
        await Notification.deleteMany({ _id: { $in: idsToDelete } });
      }
    }
  } catch (error) {
  }
}

export const topCompanies = async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = "top_companies";
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get only active jobs (not expired) and count by company
    const allJobs = await Job.find({
      $or: [
        { expirationDate: { $exists: false } },
        { expirationDate: null },
        { expirationDate: { $gte: new Date() } }
      ]
    });
    
    const companyJobCount: { [key: string]: number } = {};
    
    allJobs.forEach(job => {
      if (job.companyId) {
        const companyIdStr = job.companyId.toString();
        companyJobCount[companyIdStr] = (companyJobCount[companyIdStr] || 0) + 1;
      }
    });

    // Get all company IDs with jobs
    const companyIds = Object.keys(companyJobCount);

    // Fetch basic info (name) for all these companies to sort by name
    const companiesInfo = await AccountCompany.find({ 
      _id: { $in: companyIds } 
    }).select("companyName slug");

    // Map info to counts and sort
    const sortedCompanies = companiesInfo.map(company => ({
      id: company.id,
      companyName: company.companyName,
      slug: company.slug,
      jobCount: companyJobCount[company.id]
    }))
    .sort((a, b) => b.jobCount - a.jobCount || (a.companyName || "").localeCompare(b.companyName || "", "vi"))
    .slice(0, 5); // Take top 5
    
    const response = {
      code: "success",
      topCompanies: sortedCompanies
    };

    // Cache for 5 minutes (dynamic data - companies change with jobs)
    cache.set(cacheKey, response, CACHE_TTL.DYNAMIC);

    res.json(response);
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to fetch top companies"
    });
  }
}

export const registerPost = async (req: Request, res: Response) => {
  try {
    const existAccount = await AccountCompany.findOne({
      email: req.body.email
    })
  
    if(existAccount) {
      res.json({
        code: "error",
        message: "Email already exists in the system!"
      })
      return;
    }
    
    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    req.body.password = await bcrypt.hash(req.body.password, salt);
  
    // Create account with pending status (admin approval required)
    const newAccount = new AccountCompany({
      ...req.body,
      status: "initial"
    });
    await newAccount.save();

    // Generate slug after save to get the ID
    newAccount.slug = generateUniqueSlug(req.body.companyName, newAccount.id);
    await newAccount.save();
  
    res.json({
      code: "success",
      message: "Registration submitted! Your account is pending admin approval."
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberPassword } = req.body;
    
    const existAccount = await AccountCompany.findOne({
      email: email
    })
  
    if(!existAccount) {
      res.json({
        code: "error",
        message: "Email does not exist in the system!"
      })
      return;
    }
  
    const isPasswordValid = await bcrypt.compare(password, `${existAccount.password}`);
  
    if(!isPasswordValid) {
      res.json({
        code: "error",
        message: "Incorrect password!"
      })
      return;
    }

    // Check if account is active
    if(existAccount.status !== "active") {
      res.json({
        code: "error",
        message: "Your account is pending admin approval."
      })
      return;
    }
  
    const token = jwt.sign(
      {
        id: existAccount.id,
        email: existAccount.email,
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: rememberPassword ? "7d" : "1d"
      }
    );
  
    res.cookie("token", token, {
      maxAge: rememberPassword ? (7 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000),
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV == "production" ? true : false,
    });
  
    res.json({
      code: "success",
      message: "Login successful!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const forgotPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const existAccount = await AccountCompany.findOne({
      email: email
    })

    if(!existAccount) {
      res.json({
        code: "error",
        message: "Email does not exist in the system!"
      })
      return;
    }

    const existEmailInForgotPassword = await ForgotPassword.findOne({
      email: email,
      accountType: "company"
    })

    if(existEmailInForgotPassword) {
      res.json({
        code: "error",
        message: "Please send the request again after 5 minutes!"
      })
      return;
    }

    const otp = generateRandomNumber(6);

    const newRecord = new ForgotPassword({
      email: email,
      otp: otp,
      accountType: "company",
      expireAt: Date.now() + 5*60*1000
    });
    await newRecord.save();

    const title = `OTP for password recovery - UITJobs`;
    const content = `Your OTP is <b style="color: green; font-size: 20px;">${otp}</b>. The OTP is valid for 5 minutes, please do not share it with anyone.`;
    queueEmail(email, title, content);

    res.json({
      code: "success",
      message: "OTP has been sent to your email!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const otpPasswordPost = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    const existAccount = await AccountCompany.findOne({
      email: email
    })

    if(!existAccount) {
      res.json({
        code: "error",
        message: "Email does not exist in the system!"
      })
      return;
    }

    const existRecordInForgotPassword = await ForgotPassword.findOne({
      email: email,
      otp: otp,
      accountType: "company"
    })

    if(!existRecordInForgotPassword) {
      res.json({
        code: "error",
        message: "OTP is invalid!"
      })
      return;
    }

    await ForgotPassword.deleteOne({
      _id: existRecordInForgotPassword._id
    });

    const token = jwt.sign(
      {
        id: existAccount.id,
        email: existAccount.email,
      },
      `${process.env.JWT_SECRET}`,
      {
        expiresIn: "1d"
      }
    );

    res.cookie("token", token, {
      maxAge: 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV == "production" ? true : false,
    });

    res.json({
      code: "success",
      message: "OTP verified successfully!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const resetPasswordPost = async (req: RequestAccount, res: Response) => {
  try {
    const { password } = req.body;

    // Get current account to compare passwords
    const existAccount = await AccountCompany.findById(req.account.id);

    if (!existAccount) {
      res.json({
        code: "error",
        message: "Account not found!"
      })
      return;
    }

    // Check if new password is the same as the current password
    const isSamePassword = await bcrypt.compare(password, `${existAccount.password}`);

    if (isSamePassword) {
      res.json({
        code: "error",
        message: "New password must be different from the current password!"
      })
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    await AccountCompany.updateOne({
      _id: req.account.id
    }, {
      password: hashPassword
    });

    res.json({
      code: "success",
      message: "Password has been changed successfully!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const profilePatch = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    const existEmail = await AccountCompany.findOne({
      _id: { $ne: companyId },
      email: req.body.email
    })

    if(existEmail) {
      res.json({
        code: "error",
        message: "Email already exists!"
      })
      return;
    }

    const existPhone = await AccountCompany.findOne({
      _id: { $ne: companyId },
      phone: req.body.phone
    })

    if(existPhone) {
      res.json({
        code: "error",
        message: "Phone number already exists!"
      })
      return;
    }

    if(req.file) {
      req.body.logo = req.file.path;
    } else {
      delete req.body.logo;
    }

    // Update slug if companyName changed
    if(req.body.companyName) {
      const company = await AccountCompany.findById(companyId);
      if(company && req.body.companyName !== company.companyName) {
        req.body.slug = generateUniqueSlug(req.body.companyName, companyId);
      }
    }

    await AccountCompany.updateOne({
      _id: companyId
    }, req.body);
  
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

    for (const item of jobList) {
      const technologySlugs = (item.technologies || []).map((t: string) => convertToSlug(normalizeTechnologyName(t)));
      
      // Resolve job cities to names (with error handling)
      let jobCityNames: string[] = [];
      try {
        if (item.cities && Array.isArray(item.cities) && item.cities.length > 0) {
          const validCityIds = (item.cities as string[]).filter(id => 
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

export const list = async (req: RequestAccount, res: Response) => {
  try {
    // Check cache first
    const cacheKey = `company_list:${JSON.stringify(req.query)}`;
    const cached = cache.get<any>(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const match: any = {};
    
    // Filter by keyword (company name)
    if(req.query.keyword) {
      const keyword = req.query.keyword;
      const regex = new RegExp(`${keyword}`, "i");
      match.companyName = regex;
    }

    // Filter by city
    if(req.query.city) {
      const citySlug = req.query.city;
      const cityInfo = await City.findOne({ slug: citySlug });
      if(cityInfo) {
        match.city = cityInfo.id;
      }
    }
    
    let limitItems = 12;
    if(req.query.limitItems) {
      limitItems = parseInt(`${req.query.limitItems}`);
    }

    // Pagination
    let page = 1;
    if(req.query.page && parseInt(`${req.query.page}`) > 0) {
      page = parseInt(`${req.query.page}`);
    }
    const skip = (page - 1) * limitItems;

    // Aggregation Pipeline
    const results = await AccountCompany.aggregate([
      // Filter companies
      { $match: match },
      
      // Lookup ACTIVE jobs to count
      {
        $lookup: {
          from: "jobs",
          let: { companyIdStr: { $toString: "$_id" } },
          pipeline: [
            { $match:
              { $expr:
                { $and:
                  [
                    { $eq: ["$companyId", "$$companyIdStr"] },
                    // Active job logic
                    { $or: [
                      { $eq: [{ $type: "$expirationDate" }, "missing"] },
                      { $eq: ["$expirationDate", null] },
                      { $gte: ["$expirationDate", new Date()] }
                    ]}
                  ]
                }
              }
            },
            { $project: { _id: 1 } } // Optimize: only need ID to count
          ],
          as: "activeJobs"
        }
      },
      
      // Lookup City for cityName display
      {
        $addFields: { cityObjectId: { $toObjectId: "$city" } }
      },
      { 
        $lookup: {
          from: "cities",
          localField: "cityObjectId",
          foreignField: "_id",
          as: "cityInfo"
        }
      },
      { $unwind: { path: "$cityInfo", preserveNullAndEmptyArrays: true } },

      // Add computed fields
      { 
        $addFields: { 
          jobCount: { $size: "$activeJobs" },
          cityName: "$cityInfo.name"
        } 
      },
      
      // Sort: Job Count DESC -> Name ASC (Tie-breaker)
      { $sort: { jobCount: -1, companyName: 1 } },
      
      // Facet for Pagination metadata and data
      {
        $facet: {
          metadata: [ { $count: "total" } ],
          data: [ 
            { $skip: skip }, 
            { $limit: limitItems },
            // Project needed fields for CardCompanyItem
            { 
              $project: { 
                password: 0, token: 0, activeJobs: 0, cityInfo: 0, cityObjectId: 0 
              } 
            } 
          ]
        }
      }
    ]).collation({ locale: "vi", strength: 2 }); // Vietnamese collation for name sort

    const totalRecord = results[0]?.metadata[0]?.total || 0;
    const companyList = results[0]?.data || [];
    const totalPage = Math.ceil(totalRecord/limitItems);

    const companyListFinal = companyList.map((item: any) => ({
      id: item._id, 
      logo: item.logo,
      companyName: item.companyName,
      slug: item.slug,
      cityName: item.cityName || "",
      jobCount: item.jobCount || 0,
      totalJob: item.jobCount || 0
    }));
  
    const response = {
      code: "success",
      message: "Success!",
      companyList: companyListFinal,
      totalPage: totalPage
    };

    // Cache for 5 minutes
    cache.set(cacheKey, response, CACHE_TTL.DYNAMIC);

    res.json(response)
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const detail = async (req: RequestAccount, res: Response) => {
  try {
    const slug = req.params.slug;

    const companyInfo = await AccountCompany.findOne({
      slug: slug
    })

    if(!companyInfo) {
      res.json({
        code: "error",
        message: "Invalid data!"
      })
      return;
    }

    // Get follower count for public display
    const followerCount = await FollowCompany.countDocuments({ companyId: companyInfo.id });

    const companyDetail = {
      id: companyInfo.id,
      logo: companyInfo.logo,
      companyName: companyInfo.companyName,
      slug: companyInfo.slug,
      address: companyInfo.address,
      companyModel: companyInfo.companyModel,
      companyEmployees: companyInfo.companyEmployees,
      workingTime: companyInfo.workingTime,
      workOverTime: companyInfo.workOverTime,
      description: companyInfo.description,
      followerCount: followerCount,
    };

    const jobs = await Job
      .find({
        companyId: companyInfo.id
      })
      .sort({
        createdAt: "desc"
      })

    const cityInfo = await City.findOne({
      _id: companyInfo?.city
    })

    const jobList = [];

    for (const item of jobs) {
      if(companyInfo && cityInfo) {
        // Calculate stats
        const maxApproved = item.maxApproved || 0;
        const approvedCount = item.approvedCount || 0;
        const maxApplications = item.maxApplications || 0;
        const applicationCount = item.applicationCount || 0;
        const isFull = maxApproved > 0 && approvedCount >= maxApproved;
        const technologySlugs = (item.technologies || []).map((t: string) => convertToSlug(normalizeTechnologyName(t)));

        // Check if expired
        const isExpired = item.expirationDate 
          ? new Date(item.expirationDate) < new Date()
          : false;

        const itemFinal = {
          id: item.id,
          slug: item.slug,
          companyLogo: companyInfo.logo,
          title: item.title,
          companyName: companyInfo.companyName,
          companySlug: companyInfo.slug,
          salaryMin: item.salaryMin,
          salaryMax: item.salaryMax,
          position: item.position,
          workingForm: item.workingForm,
          companyCity: cityInfo.name,
          technologies: item.technologies,
          technologySlugs: technologySlugs,
          createdAt: item.createdAt,
          isFull: isFull,
          isExpired: isExpired,
          expirationDate: item.expirationDate || null,
          maxApplications: maxApplications,
          maxApproved: maxApproved,
          applicationCount: applicationCount,
          approvedCount: approvedCount
        };
        jobList.push(itemFinal);
      }
    }
  
    res.json({
      code: "success",
      message: "Success!",
      companyDetail: companyDetail,
      jobList: jobList
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const getCVList = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    const jobList = await Job
      .find({
        companyId: companyId
      });

    const jobListId = jobList.map(item => item.id);
    
    const cvList = await CV
      .find({
        jobId: { $in: jobListId }
      })
      .sort({
        createdAt: "desc"
      });

    const dataFinal = [];

    for (const item of cvList) {
      const jobInfo = await Job.findOne({
        _id: item.jobId
      })
      if(jobInfo) {
        const itemFinal = {
          id: item.id,
          jobTitle: jobInfo.title,
          fullName: item.fullName,
          email: item.email,
          phone: item.phone,
          salaryMin: jobInfo.salaryMin,
          salaryMax: jobInfo.salaryMax,
          position: jobInfo.position,
          workingForm: jobInfo.workingForm,
          viewed: item.viewed,
          status: item.status,
        };
        dataFinal.push(itemFinal);
      }
    }
  
    res.json({
      code: "success",
      message: "Success!",
      cvList: dataFinal
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const getCVDetail = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found!" });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    })

    if(!infoCV) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    })

    if(!infoJob) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    // Lookup candidate to get verification status
    const candidateInfo = await AccountCandidate.findOne({
      email: infoCV.email
    });

    const dataFinalCV = {
      fullName: infoCV.fullName,
      email: infoCV.email,
      phone: infoCV.phone,
      fileCV: infoCV.fileCV,
      status: infoCV.status,
      isVerified: candidateInfo?.isVerified || false,
      studentId: candidateInfo?.studentId || null,
    };

    const dataFinalJob = {
      id: infoJob.id,
      slug: infoJob.slug,
      title: infoJob.title,
      salaryMin: infoJob.salaryMin,
      salaryMax: infoJob.salaryMax,
      position: infoJob.position,
      workingForm: infoJob.workingForm,
      technologies: infoJob.technologies,
      technologySlugs: (infoJob.technologies || []).map((t: string) => convertToSlug(normalizeTechnologyName(t))),
    };

    // Update status to viewed (only if still initial/pending)
    if (infoCV.status === "initial") {
      await CV.updateOne({
        _id: cvId
      }, {
        viewed: true,
        status: "viewed"
      });

      // Notify candidate that their CV was viewed
      try {
        if (candidateInfo) {
          const company = await AccountCompany.findById(companyId);
          const viewNotif = await Notification.create({
            candidateId: candidateInfo._id,
            type: "application_viewed",
            title: "CV Viewed!",
            message: `${company?.companyName || "A company"} has viewed your application for ${infoJob.title}`,
            link: `/candidate-manage/cv/list`,
            read: false,
            data: {
              jobId: infoJob._id,
              jobTitle: infoJob.title,
              cvId: infoCV._id,
              companyName: company?.companyName
            }
          });
          
          // Push real-time notification via Socket.IO
          notifyCandidate(candidateInfo._id.toString(), viewNotif);
        }
      } catch (err) {
      }
    }
  
    res.json({
      code: "success",
      message: "Success!",
      cvDetail: dataFinalCV,
      jobDetail: dataFinalJob
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const changeStatusCVPatch = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;
    const { status } = req.body;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found!" });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    })

    if(!infoCV) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    })

    if(!infoJob) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const oldStatus = infoCV.status;
    const newStatus = status;

    // Update approvedCount based on status change
    if (oldStatus !== newStatus) {
      // If changing TO approved, increment approvedCount
      if (newStatus === "approved" && oldStatus !== "approved") {
        // Check if max approved reached
        if (infoJob.maxApproved && infoJob.maxApproved > 0) {
          if ((infoJob.approvedCount || 0) >= infoJob.maxApproved) {
            res.json({
              code: "error",
              message: "Maximum approved candidates reached!"
            });
            return;
          }
        }
        await Job.updateOne(
          { _id: infoCV.jobId },
          { $inc: { approvedCount: 1 } }
        );
      }
      // If changing FROM approved to something else, decrement approvedCount
      else if (oldStatus === "approved" && newStatus !== "approved") {
        await Job.updateOne(
          { _id: infoCV.jobId },
          { $inc: { approvedCount: -1 } }
        );
      }
    }

    // Update CV status
    await CV.updateOne({
      _id: cvId
    }, {
      status: status
    });

    // Notify candidate about status change
    if (oldStatus !== newStatus && (newStatus === "approved" || newStatus === "rejected")) {
      try {
        // Find candidate by email
        const candidate = await AccountCandidate.findOne({ email: infoCV.email });
        if (candidate) {
          const company = await AccountCompany.findById(companyId);
          const notifType = newStatus === "approved" ? "application_approved" : "application_rejected";
          const notifTitle = newStatus === "approved" ? "Application Approved!" : "Application Update";
          const notifMessage = newStatus === "approved" 
            ? `Congratulations! Your application for ${infoJob.title} at ${company?.companyName || "the company"} has been approved!`
            : `Your application for ${infoJob.title} at ${company?.companyName || "the company"} was not selected.`;

          const statusNotif = await Notification.create({
            candidateId: candidate._id,
            type: notifType,
            title: notifTitle,
            message: notifMessage,
            link: `/candidate-manage/cv/list`,
            read: false,
            data: {
              jobId: infoJob._id,
              jobTitle: infoJob.title,
              cvId: infoCV._id,
              companyName: company?.companyName
            }
          });
          
          // Push real-time notification via Socket.IO
          notifyCandidate(candidate._id.toString(), statusNotif);

          // Send email to candidate about status change
          const emailSubject = newStatus === "approved" 
            ? `Congratulations! Your application for ${infoJob.title} was approved!`
            : `Update on your application for ${infoJob.title}`;
          const emailContent = newStatus === "approved"
            ? `
              <h2>🎉 Congratulations!</h2>
              <p>Your application for <strong>${infoJob.title}</strong> at <strong>${company?.companyName || "the company"}</strong> has been <span style="color: green; font-weight: bold;">approved</span>!</p>
              <p>The company will contact you soon for next steps.</p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3069'}/candidate-manage/cv/list">View your applications</a></p>
            `
            : `
              <h2>Application Update</h2>
              <p>Your application for <strong>${infoJob.title}</strong> at <strong>${company?.companyName || "the company"}</strong> was not selected this time.</p>
              <p>Don't give up! Check out other opportunities on our platform.</p>
              <p><a href="${process.env.FRONTEND_URL || 'http://localhost:3069'}/search">Find more jobs</a></p>
            `;
          if (infoCV.email) {
            queueEmail(infoCV.email, emailSubject, emailContent);
          }
        }
      } catch (err) {
      }
    }
  
    res.json({
      code: "success",
      message: "Status changed!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

export const deleteCVDel = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found!" });
      return;
    }

    const infoCV = await CV.findOne({
      _id: cvId
    })

    if(!infoCV) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const infoJob = await Job.findOne({
      _id: infoCV.jobId,
      companyId: companyId
    })

    if(!infoJob) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    // Update job counts before deleting CV
    const updateCounts: Record<string, number> = {
      applicationCount: -1  // Always decrement application count
    };
    if (infoCV.status === "approved") {
      updateCounts.approvedCount = -1;  // Decrement approved count if CV was approved
    }
    await Job.updateOne(
      { _id: infoCV.jobId },
      { $inc: updateCounts }
    );

    // Delete CV file from Cloudinary
    if (infoCV.fileCV) {
      await deleteImage(infoCV.fileCV as string);
    }

    // Delete CV
    await CV.deleteOne({
      _id: cvId
    });
  
    res.json({
      code: "success",
      message: "CV deleted!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

// Request email change - sends OTP to new email
export const requestEmailChange = async (req: RequestAccount, res: Response) => {
  try {
    const { newEmail } = req.body;
    const accountId = req.account.id;

    if (!newEmail) {
      res.json({
        code: "error",
        message: "Please provide new email!"
      });
      return;
    }

    // Check if email is same as current
    if (newEmail === req.account.email) {
      res.json({
        code: "error",
        message: "New email is same as current email!"
      });
      return;
    }

    // Check if email already exists in candidate or company accounts
    const existCandidate = await AccountCandidate.findOne({ email: newEmail });
    const existCompany = await AccountCompany.findOne({ email: newEmail });
    if (existCandidate || existCompany) {
      res.json({
        code: "error",
        message: "This email is already registered!"
      });
      return;
    }

    // Delete any existing pending requests for this account
    await EmailChangeRequest.deleteMany({ accountId: accountId });

    // Generate OTP
    const otp = generateRandomNumber(6);
    const expiredAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save request
    const request = new EmailChangeRequest({
      accountId: accountId,
      accountType: "company",
      newEmail: newEmail,
      otp: otp,
      expiredAt: expiredAt
    });
    await request.save();

    // Send OTP to new email
    queueEmail(
      newEmail,
      "UITJobs - Email Change Verification",
      `<p>Your OTP code for email change is: <strong>${otp}</strong></p>
       <p>This code will expire in 10 minutes.</p>
       <p>If you did not request this, please ignore this email.</p>`
    );

    res.json({
      code: "success",
      message: "OTP sent to your new email!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to request email change!"
    });
  }
}

// Verify email change OTP and update email
export const verifyEmailChange = async (req: RequestAccount, res: Response) => {
  try {
    const { otp } = req.body;
    const accountId = req.account.id;

    if (!otp) {
      res.json({
        code: "error",
        message: "Please provide OTP!"
      });
      return;
    }

    // Find pending request
    const request = await EmailChangeRequest.findOne({
      accountId: accountId,
      accountType: "company",
      otp: otp,
      expiredAt: { $gt: new Date() }
    });

    if (!request) {
      res.json({
        code: "error",
        message: "Invalid or expired OTP!"
      });
      return;
    }

    // Update email in account
    await AccountCompany.updateOne(
      { _id: accountId },
      { email: request.newEmail }
    );

    // Delete the request
    await EmailChangeRequest.deleteOne({ _id: request._id });

    res.json({
      code: "success",
      message: "Email changed successfully! Please login again with your new email."
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to verify email change!"
    });
  }
}

// Get follower count for company
export const getFollowerCount = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    const followerCount = await FollowCompany.countDocuments({ companyId: companyId });

    res.json({
      code: "success",
      followerCount: followerCount
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get follower count!"
    });
  }
}

// Get notifications for company
export const getCompanyNotifications = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    const notifications = await Notification.find({ companyId: companyId })
      .sort({ createdAt: -1 })
      .limit(notificationConfig.maxStored)
      .select("title message link read createdAt type");

    const unreadCount = await Notification.countDocuments({ 
      companyId: companyId, 
      read: false 
    });

    res.json({
      code: "success",
      notifications: notifications,
      unreadCount: unreadCount
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get notifications!"
    });
  }
}

// Mark single notification as read for company
export const markCompanyNotificationRead = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;
    const notifId = req.params.id;

    await Notification.updateOne(
      { _id: notifId, companyId: companyId },
      { read: true }
    );

    res.json({
      code: "success",
      message: "Notification marked as read!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to mark notification as read!"
    });
  }
}

// Mark all notifications as read for company
export const markAllCompanyNotificationsRead = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    await Notification.updateMany(
      { companyId: companyId, read: false },
      { read: true }
    );

    res.json({
      code: "success",
      message: "All notifications marked as read!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to mark notifications as read!"
    });
  }
}

// Get analytics for company's job postings
export const getAnalytics = async (req: RequestAccount, res: Response) => {
  try {
    const companyId = req.account.id;

    // Get all jobs for this company
    const jobs = await Job.find({ companyId }).sort({ createdAt: -1 });
    // CV.jobId is stored as String, so convert ObjectIds to strings
    const jobIds = jobs.map((j: any) => j._id.toString());

    // Count CVs by status for this company's jobs
    const cvCounts = await CV.aggregate([
      { $match: { jobId: { $in: jobIds } } },
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    
    const statusCounts: Record<string, number> = {};
    cvCounts.forEach((c: any) => {
      statusCounts[c._id] = c.count;
    });

    const totalInitial = statusCounts["initial"] || 0;
    const totalViewed = statusCounts["viewed"] || 0;
    const totalApproved = statusCounts["approved"] || 0;
    const totalRejected = statusCounts["rejected"] || 0;
    const totalApplications = totalInitial + totalViewed + totalApproved + totalRejected;

    // Calculate overview metrics from actual data
    let totalViews = 0;

    const jobIdStrings = jobs.map((j: any) => j._id.toString());
    
    const cvAggregation = await CV.aggregate([
      { $match: { jobId: { $in: jobIdStrings } } },
      {
        $group: {
          _id: "$jobId",
          totalApplications: { $sum: 1 },
          approvedCount: {
            $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] }
          }
        }
      }
    ]);
    
    // Create lookup map for O(1) access
    const cvCountMap = new Map(cvAggregation.map((c: any) => [c._id, c]));

    const jobsData = jobs.map((job: any) => {
      const views = job.viewCount || 0;
      const jobIdStr = job._id.toString();
      
      const cvStats = cvCountMap.get(jobIdStr) || { totalApplications: 0, approvedCount: 0 };
      const actualApplications = cvStats.totalApplications;
      const actualApproved = cvStats.approvedCount;

      totalViews += views;

      const applyRate = views > 0 ? ((actualApplications / views) * 100).toFixed(1) : 0;
      const approvalRate = actualApplications > 0 ? ((actualApproved / actualApplications) * 100).toFixed(1) : 0;

      return {
        id: job.id,
        title: job.title,
        slug: job.slug,
        views,
        applications: actualApplications,
        approved: actualApproved,
        applyRate: parseFloat(applyRate as string) || 0,
        approvalRate: parseFloat(approvalRate as string) || 0,
        createdAt: job.createdAt,
        isExpired: job.expirationDate ? new Date(job.expirationDate) < new Date() : false
      };
    });

    // Calculate overall rates
    const overallApplyRate = totalViews > 0 
      ? parseFloat(((totalApplications / totalViews) * 100).toFixed(1)) 
      : 0;
    const overallApprovalRate = totalApplications > 0 
      ? parseFloat(((totalApproved / totalApplications) * 100).toFixed(1)) 
      : 0;

    res.json({
      code: "success",
      overview: {
        totalJobs: jobs.length,
        totalViews,
        totalApplications,
        totalApproved,
        totalViewed,
        totalRejected,
        totalPending: totalInitial,
        applyRate: overallApplyRate,
        approvalRate: overallApprovalRate
      },
      jobs: jobsData
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get analytics!"
    });
  }
}