import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountCompany from "../../models/account-company.model";
import AccountCandidate from "../../models/account-candidate.model";
import EmailChangeRequest from "../../models/email-change-request.model";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { queueEmail } from "../../helpers/mail.helper";
import { generateUniqueSlug } from "../../helpers/slugify.helper";

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
