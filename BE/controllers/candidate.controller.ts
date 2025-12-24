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
  
    const newAccount = new AccountCandidate(req.body);
    await newAccount.save();
  
    res.json({
      code: "success",
      message: "Account registered successfully!"
    })
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Invalid data!"
    })
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
    console.log(error);
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
    const title = `OTP for password recovery - UIT-UA.ITJobs`;
    const content = `Your OTP is <b style="color: green; font-size: 20px;">${otp}</b>. The OTP is valid for 5 minutes, please do not share it with anyone.`;
    sendMail(email, title, content);

    res.json({
      code: "success",
      message: "OTP has been sent to your email!"
    })
  } catch (error) {
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
    console.log(error);
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
      "UIT-UA.ITJobs - Email Change Verification",
      `<p>Your OTP code for email change is: <strong>${otp}</strong></p>
       <p>This code will expire in 10 minutes.</p>
       <p>If you did not request this, please ignore this email.</p>`
    );

    res.json({
      code: "success",
      message: "OTP sent to your new email!"
    });
  } catch (error) {
    console.log(error);
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
    console.log(error);
    res.json({
      code: "error",
      message: "Failed to verify email change!"
    });
  }
}