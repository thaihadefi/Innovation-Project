import { Request, Response } from "express";
import AccountCandidate from "../models/account-candidate.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RequestAccount } from "../interfaces/request.interface";
import CV from "../models/cv.model";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import ForgotPassword from "../models/forgot-password.model";
import { generateRandomNumber } from "../helpers/generate.helper";
import { sendMail } from "../helpers/mail.helper";
import { deleteImage } from "../helpers/cloudinary.helper";
import EmailChangeRequest from "../models/emailChangeRequest.model";
import RegisterOtp from "../models/register-otp.model";
import FollowCompany from "../models/follow-company.model";
import Notification from "../models/notification.model";
import SavedJob from "../models/saved-job.model";
import { notificationConfig } from "../config/variable";

export const registerPost = async (req: Request, res: Response) => {
  try {
    const existAccount = await AccountCandidate.findOne({
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
  
    // Create account with pending status
    const newAccount = new AccountCandidate({
      ...req.body,
      status: "initial"
    });
    await newAccount.save();

    // Generate OTP and send email
    const otp = generateRandomNumber(6);
    
    // Delete any existing OTP for this email
    await RegisterOtp.deleteMany({ email: req.body.email });
    
    // Save new OTP
    const otpRecord = new RegisterOtp({
      email: req.body.email,
      otp: otp
    });
    await otpRecord.save();

    // Send OTP email
    const title = `Verify your email - UITJobs`;
    const content = `Your OTP is <b style="color: green; font-size: 20px;">${otp}</b>. The OTP is valid for 10 minutes.`;
    sendMail(req.body.email, title, content);
  
    res.json({
      code: "success",
      message: "Please check your email to verify your account!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Invalid data!"
    })
  }
}

// Verify OTP and activate account
export const verifyRegisterOtp = async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;

    // Find OTP record
    const otpRecord = await RegisterOtp.findOne({ email, otp });

    if (!otpRecord) {
      res.json({
        code: "error",
        message: "Invalid or expired OTP!"
      });
      return;
    }

    // Activate account
    await AccountCandidate.updateOne(
      { email: email },
      { status: "active" }
    );

    // Delete OTP record
    await RegisterOtp.deleteMany({ email });

    res.json({
      code: "success",
      message: "Account verified successfully! You can now login."
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Verification failed!"
    });
  }
}

export const loginPost = async (req: Request, res: Response) => {
  try {
    const { email, password, rememberPassword } = req.body;
    
    const existAccount = await AccountCandidate.findOne({
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
        message: "Please verify your email to login."
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

    // Check if email exists in the database
    const existAccount = await AccountCandidate.findOne({
      email: email
    })

    if(!existAccount) {
      res.json({
        code: "error",
        message: "Email does not exist in the system!"
      })
      return;
    }

    // Check if email already has a pending OTP
    const existEmailInForgotPassword = await ForgotPassword.findOne({
      email: email,
      accountType: "candidate"
    })

    if(existEmailInForgotPassword) {
      res.json({
        code: "error",
        message: "Please send the request again after 5 minutes!"
      })
      return;
    }

    // Create OTP 
    const otp = generateRandomNumber(6);

    // Save to database: email and otp (expire in 5 minutes)
    const newRecord = new ForgotPassword({
      email: email,
      otp: otp,
      accountType: "candidate",
      expireAt: Date.now() + 5*60*1000
    });
    await newRecord.save();

    // Send OTP to email
    const title = `OTP for password recovery - UITJobs`;
    const content = `Your OTP is <b style="color: green; font-size: 20px;">${otp}</b>. The OTP is valid for 5 minutes, please do not share it with anyone.`;
    sendMail(email, title, content);

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

    // Check if email exists in database
    const existAccount = await AccountCandidate.findOne({
      email: email
    })

    if(!existAccount) {
      res.json({
        code: "error",
        message: "Email does not exist in the system!"
      })
      return;
    }

    // Verify OTP
    const existRecordInForgotPassword = await ForgotPassword.findOne({
      email: email,
      otp: otp,
      accountType: "candidate"
    })

    if(!existRecordInForgotPassword) {
      res.json({
        code: "error",
        message: "OTP is invalid!"
      })
      return;
    }

    // Delete OTP record after successful verification
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
    const existAccount = await AccountCandidate.findById(req.account.id);

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

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(password, salt);

    await AccountCandidate.updateOne({
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
    const candidateId = req.account.id;

    const existEmail = await AccountCandidate.findOne({
      _id: { $ne: candidateId },
      email: req.body.email
    })

    if(existEmail) {
      res.json({
        code: "error",
        message: "Email already exists!"
      })
      return;
    }

    const existPhone = await AccountCandidate.findOne({
      _id: { $ne: candidateId },
      phone: req.body.phone
    })

    if(existPhone) {
      res.json({
        code: "error",
        message: "Phone number already exists!"
      })
      return;
    }

    // Check if studentId already exists (must be unique)
    if (req.body.studentId) {
      const existStudentId = await AccountCandidate.findOne({
        _id: { $ne: candidateId },
        studentId: req.body.studentId
      });

      if (existStudentId) {
        res.json({
          code: "error",
          message: "Student ID already exists!"
        })
        return;
      }
    }

    if(req.file) {
      req.body.avatar = req.file.path;
    } else {
      delete req.body.avatar;
    }

    await AccountCandidate.updateOne({
      _id: candidateId
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

export const getCVList = async (req: RequestAccount, res: Response) => {
  try {
    const email = req.account.email;
    
    const cvList = await CV
      .find({
        email: email
      })
      .sort({
        createdAt: "desc"
      });

    const dataFinal = [];

    for (const item of cvList) {
      const jobInfo = await Job.findOne({
        _id: item.jobId
      })
      const companyInfo = await AccountCompany.findOne({
        _id: jobInfo?.companyId
      })
      if(jobInfo && companyInfo) {
        const itemFinal = {
          id: item.id,
          jobTitle: jobInfo.title,
          companyName: companyInfo.companyName,
          salaryMin: jobInfo.salaryMin,
          salaryMax: jobInfo.salaryMax,
          position: jobInfo.position,
          workingForm: jobInfo.workingForm,
          status: item.status,
          fileCV: item.fileCV, // Add CV file URL for viewing
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

// Get CV detail for viewing/editing
export const getCVDetail = async (req: RequestAccount, res: Response) => {
  try {
    const email = req.account.email;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({
        code: "error",
        message: "CV not found!"
      });
      return;
    }

    const cvInfo = await CV.findOne({
      _id: cvId,
      email: email
    })

    if(!cvInfo) {
      res.json({
        code: "error",
        message: "CV not found!"
      })
      return;
    }

    const jobInfo = await Job.findOne({
      _id: cvInfo.jobId
    })

    const cvDetail = {
      id: cvInfo.id,
      fullName: cvInfo.fullName,
      email: cvInfo.email,
      phone: cvInfo.phone,
      fileCV: cvInfo.fileCV,
      status: cvInfo.status,
      jobTitle: jobInfo?.title || "",
      jobSlug: jobInfo?.slug || "",
    };

    res.json({
      code: "success",
      message: "Success!",
      cvDetail: cvDetail
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    })
  }
}

// Update CV information
export const updateCVPatch = async (req: RequestAccount, res: Response) => {
  try {
    const email = req.account.email;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found!" });
      return;
    }

    const cvInfo = await CV.findOne({
      _id: cvId,
      email: email
    })

    if(!cvInfo) {
      res.json({
        code: "error",
        message: "CV not found!"
      })
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
      message: "CV updated successfully!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to update CV!"
    })
  }
}

// Delete CV
export const deleteCVDel = async (req: RequestAccount, res: Response) => {
  try {
    const email = req.account.email;
    const cvId = req.params.id;

    // Validate ObjectId format
    if (!cvId || !/^[a-fA-F0-9]{24}$/.test(cvId)) {
      res.json({ code: "error", message: "CV not found!" });
      return;
    }

    const cvInfo = await CV.findOne({
      _id: cvId,
      email: email
    })

    if(!cvInfo) {
      res.json({
        code: "error",
        message: "CV not found!"
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

    res.json({
      code: "success",
      message: "CV deleted successfully!"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to delete CV!"
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
      accountType: "candidate",
      newEmail: newEmail,
      otp: otp,
      expiredAt: expiredAt
    });
    await request.save();

    // Send OTP to new email
    sendMail(
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
      accountType: "candidate",
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
    await AccountCandidate.updateOne(
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

// Toggle follow/unfollow a company
export const toggleFollowCompany = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const companyId = req.params.companyId;

    // Validate companyId
    if (!companyId || !/^[a-fA-F0-9]{24}$/.test(companyId)) {
      res.json({ code: "error", message: "Invalid company!" });
      return;
    }

    // Check if company exists
    const company = await AccountCompany.findById(companyId);
    if (!company) {
      res.json({ code: "error", message: "Company not found!" });
      return;
    }

    // Check if already following
    const existingFollow = await FollowCompany.findOne({
      candidateId: candidateId,
      companyId: companyId
    });

    if (existingFollow) {
      // Unfollow
      await FollowCompany.deleteOne({ _id: existingFollow._id });
      res.json({
        code: "success",
        message: "Unfollowed successfully!",
        following: false
      });
    } else {
      // Follow
      const newFollow = new FollowCompany({
        candidateId: candidateId,
        companyId: companyId
      });
      await newFollow.save();
      res.json({
        code: "success",
        message: "Followed successfully!",
        following: true
      });
    }
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    });
  }
}

// Check if following a company
export const checkFollowStatus = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const companyId = req.params.companyId;

    const existingFollow = await FollowCompany.findOne({
      candidateId: candidateId,
      companyId: companyId
    });

    res.json({
      code: "success",
      following: !!existingFollow
    });
  } catch (error) {
    res.json({
      code: "error",
      following: false
    });
  }
}

// Get list of followed companies
export const getFollowedCompanies = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;

    const follows = await FollowCompany.find({ candidateId: candidateId })
      .sort({ createdAt: -1 });

    const companyIds = follows.map(f => f.companyId);
    
    const companies = await AccountCompany.find({ _id: { $in: companyIds } })
      .select("companyName logo slug");

    res.json({
      code: "success",
      companies: companies
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get followed companies!"
    });
  }
}

// Get notifications for candidate
export const getNotifications = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;

    const notifications = await Notification.find({ candidateId: candidateId })
      .sort({ createdAt: -1 })
      .limit(notificationConfig.maxStored)
      .select("title message link read createdAt type");

    const unreadCount = await Notification.countDocuments({ 
      candidateId: candidateId, 
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

// Mark notification as read
export const markNotificationRead = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const notificationId = req.params.notificationId;

    await Notification.updateOne(
      { _id: notificationId, candidateId: candidateId },
      { read: true }
    );

    res.json({
      code: "success",
      message: "Marked as read!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    });
  }
}

// Mark all notifications as read
export const markAllNotificationsRead = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;

    await Notification.updateMany(
      { candidateId: candidateId, read: false },
      { read: true }
    );

    res.json({
      code: "success",
      message: "All marked as read!"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    });
  }
}

// Toggle save/unsave a job
export const toggleSaveJob = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const { jobId } = req.params;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.json({
        code: "error",
        message: "Job not found!"
      });
    }

    // Check if already saved
    const existingSave = await SavedJob.findOne({ candidateId, jobId });

    if (existingSave) {
      // Unsave
      await SavedJob.deleteOne({ _id: existingSave._id });
      res.json({
        code: "success",
        message: "Job removed from saved!",
        saved: false
      });
    } else {
      // Save
      await SavedJob.create({ candidateId, jobId });
      res.json({
        code: "success",
        message: "Job saved!",
        saved: true
      });
    }
  } catch (error) {
    console.error("toggleSaveJob error:", error);
    res.json({
      code: "error",
      message: "Failed to save job!"
    });
  }
}

// Check if a job is saved
export const checkSaveStatus = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const { jobId } = req.params;

    const existingSave = await SavedJob.findOne({ candidateId, jobId });

    res.json({
      code: "success",
      saved: !!existingSave
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed!"
    });
  }
}

// Get list of saved jobs
export const getSavedJobs = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const savedJobs = await SavedJob.find({ candidateId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate({
        path: 'jobId',
        populate: {
          path: 'companyId',
          select: 'companyName avatar'
        }
      });

    const total = await SavedJob.countDocuments({ candidateId });

    // Filter out null jobs (deleted jobs)
    const validSavedJobs = savedJobs.filter(s => s.jobId !== null);

    res.json({
      code: "success",
      savedJobs: validSavedJobs.map(s => ({
        savedId: s._id,
        savedAt: s.createdAt,
        job: s.jobId
      })),
      totalPages: Math.ceil(total / limit),
      currentPage: page
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to get saved jobs!"
    });
  }
}