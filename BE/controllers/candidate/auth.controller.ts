import { Request, Response } from "express";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { RequestAccount } from "../../interfaces/request.interface";
import ForgotPassword from "../../models/forgot-password.model";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { queueEmail } from "../../helpers/mail.helper";
import RegisterOtp from "../../models/register-otp.model";

export const registerPost = async (req: Request, res: Response) => {
  try {
    const existAccount = await AccountCandidate.findOne({
      email: req.body.email
    }).select('_id').lean(); // Only check existence
  
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
    queueEmail(req.body.email, title, content);
  
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
    const otpRecord = await RegisterOtp.findOne({ email, otp }).select('expiredAt'); // Only need expiredAt

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
    }).select('password email fullName avatar phone studentId isVerified skills status'); // Only login fields
  
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
    }).select('_id').lean(); // Only check existence

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
    }).select('_id').lean(); // Only check existence

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

    // Check if email exists in database
    const existAccount = await AccountCandidate.findOne({
      email: email
    }).select('_id email'); // Need _id and email for token

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
    }).select('_id'); // Only need _id for deletion

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
    const existAccount = await AccountCandidate.findById(req.account.id).select('password'); // Only need password

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
