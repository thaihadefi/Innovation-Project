import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountCompany from "../../models/account-company.model";
import AccountCandidate from "../../models/account-candidate.model";
import EmailChangeRequest from "../../models/email-change-request.model";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { generateUniqueSlug } from "../../helpers/slugify.helper";
import { deleteImage } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";

export const profilePatch = async (req: RequestAccount, res: Response) => {
  // Once logo is saved to DB, outer catch must NOT delete it
  let profileUpdated = false;
  try {
    const companyId = req.account.id;

    const needOldLogo = !!req.file || req.body.logo === null || req.body.logo === "";

    // Run all uniqueness checks + old logo fetch in parallel
    // Guard email/phone: only query when field is actually provided (undefined → Mongoose strips → wrong match)
    const [currentCompany, existEmail, existPhone] = await Promise.all([
      needOldLogo
        ? AccountCompany.findById(companyId).select('logo').lean()
        : Promise.resolve(null),
      req.body.email !== undefined
        ? AccountCompany.findOne({ _id: { $ne: companyId }, email: req.body.email }).select('_id').lean()
        : Promise.resolve(null),
      req.body.phone !== undefined
        ? AccountCompany.findOne({ _id: { $ne: companyId }, phone: req.body.phone }).select('_id').lean()
        : Promise.resolve(null),
    ]);

    // Helper: cleanup uploaded logo on early return
    const cleanupFile = () => { if (req.file) void deleteImage(req.file.path).catch(() => {}); };

    if(existEmail) {
      cleanupFile();
      res.status(409).json({
      code: "error",
      message: "Email already exists."
      })
      return;
    }

    if(existPhone) {
      cleanupFile();
      res.status(409).json({
      code: "error",
      message: "Phone number already exists."
      })
      return;
    }

    const updateData: any = {};

    if (req.body.companyName !== undefined) {
      if (req.account.companyName && req.body.companyName !== req.account.companyName) {
        cleanupFile();
        res.status(400).json({
      code: "error",
          message: "Company name cannot be changed after creation."
        })
        return;
      }
      updateData.companyName = req.body.companyName;
    }
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;

    // Block direct email changes — must use OTP-based requestEmailChange flow
    if (req.body.email !== undefined && req.body.email !== req.account.email) {
      cleanupFile();
      res.status(400).json({ code: "error", message: "Email cannot be changed here. Please use the 'Change Email' button." });
      return;
    }
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.location !== undefined) updateData.location = req.body.location;
    if (req.body.address !== undefined) updateData.address = req.body.address;
    if (req.body.companyModel !== undefined) updateData.companyModel = req.body.companyModel;
    if (req.body.companyEmployees !== undefined) updateData.companyEmployees = req.body.companyEmployees;
    if (req.body.workingTime !== undefined) updateData.workingTime = req.body.workingTime;
    if (req.body.workOverTime !== undefined) updateData.workOverTime = req.body.workOverTime;
    if (req.body.description !== undefined) updateData.description = req.body.description;
    if (req.body.website !== undefined) updateData.website = req.body.website;
    if (req.body.facebook !== undefined) updateData.facebook = req.body.facebook;
    if (req.body.linkedin !== undefined) updateData.linkedin = req.body.linkedin;
    if (req.body.taxCode !== undefined) updateData.taxCode = req.body.taxCode;
    if (req.body.size !== undefined) updateData.size = req.body.size;
    if (req.body.industry !== undefined) updateData.industry = req.body.industry;
    if (req.body.foundedYear !== undefined) updateData.foundedYear = req.body.foundedYear;
    if (req.body.companyType !== undefined) updateData.companyType = req.body.companyType;

    if(req.file) {
      updateData.logo = req.file.path;
    } else if (req.body.logo === null || req.body.logo === "") {
      // Logo explicitly removed by user — clear it and delete from Cloudinary
      updateData.logo = null;
    }

    // Update slug if companyName changed
    if(updateData.companyName) {
      const company = await AccountCompany.findById(companyId).select('companyName').lean(); // Only need companyName
      if(company && updateData.companyName !== company.companyName) {
        updateData.slug = generateUniqueSlug(updateData.companyName, companyId);
      }
    }

    await AccountCompany.updateOne({
      _id: companyId
    }, updateData);
    profileUpdated = true; // logo URL now in DB — do not delete on subsequent errors

    // Delete old logo from Cloudinary when replaced or removed
    const oldLogo = (currentCompany as any)?.logo as string | undefined;
    if (oldLogo) {
      const isReplaced = req.file && oldLogo !== req.file.path;
      const isRemoved = !req.file && (req.body.logo === null || req.body.logo === "");
      if (isReplaced || isRemoved) {
        void deleteImage(oldLogo).catch((err) => console.error('[Cloudinary] Failed to delete:', err));
      }
    }
    
    // Invalidate all caches affected by company profile changes
    await invalidateJobDiscoveryCaches();
  
    res.json({
      code: "success",
      message: "Update successful."
    })
  } catch (error: any) {
    // Only clean up uploaded logo if DB write never completed
    if (req.file && !profileUpdated) {
      void deleteImage(req.file.path).catch((e) => console.error('[Cloudinary] Failed to delete orphaned upload:', e));
    }
    // Handle concurrent profile update race condition (unique index violation)
    if (error.code === 11000) {
      res.status(409).json({ code: "error", message: "Phone number already exists." });
      return;
    }
    res.status(500).json({
      code: "error",
      message: "Internal server error."
    })
  }
}

// Request email change - sends OTP to new email
export const requestEmailChange = async (req: RequestAccount, res: Response) => {
  try {
    const { newEmail } = req.body;
    const accountId = req.account.id;

    if (!newEmail) {
      res.status(400).json({
      code: "error",
        message: "Please provide new email."
      });
      return;
    }

    // Check if email is same as current
    if (newEmail === req.account.email) {
      res.status(409).json({
      code: "error",
        message: "New email is same as current email."
      });
      return;
    }

    // Check if email already exists in candidate or company accounts (parallel)
    const [existCandidate, existCompany] = await Promise.all([
      AccountCandidate.findOne({ email: newEmail }).select('_id').lean(), // Only check existence
      AccountCompany.findOne({ email: newEmail }).select('_id').lean() // Only check existence
    ]);
    if (existCandidate || existCompany) {
      res.status(409).json({
      code: "error",
      message: "This email is already registered."
      });
      return;
    }

    // Generate OTP
    const otp = generateRandomNumber(6);
    const expireAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Atomically upsert — unique index on { accountId, accountType } ensures only one record exists
    // replaces any previous pending request; eliminates race condition from deleteMany + save pattern
    await EmailChangeRequest.findOneAndUpdate(
      { accountId: accountId, accountType: "company" },
      { $set: { newEmail: newEmail, otp: otp, expireAt: expireAt } },
      { upsert: true }
    );

    // Send OTP to new email (critical) + security alert to current email (fire-and-forget)
    const { subject: otpSubject, html: otpHtml } = emailTemplates.emailChangeOtp(otp, newEmail);
    const { subject: alertSubject, html: alertHtml } = emailTemplates.emailChangeSecurityAlert(newEmail);
    try {
      await sendEmail(newEmail, otpSubject, otpHtml);
    } catch {
      await EmailChangeRequest.deleteOne({ accountId: accountId, accountType: "company" });
      res.status(500).json({ code: "error", message: "Failed to send OTP email. Please try again." });
      return;
    }
    if (req.account.email) {
      void sendEmail(req.account.email, alertSubject, alertHtml).catch(() => {});
    }

    res.json({
      code: "success",
      message: "OTP sent to your new email."
    });
  } catch (error) {
    if ((error as any).code === 11000) {
      res.status(409).json({ code: "error", message: "A request is already in progress. Please check your email for the OTP." });
      return;
    }
    res.status(500).json({
      code: "error",
      message: "Failed to request email change."
    });
  }
}

// Verify email change OTP and update email
export const verifyEmailChange = async (req: RequestAccount, res: Response) => {
  try {
    const { otp } = req.body;
    const accountId = req.account.id;

    if (!otp) {
      res.status(400).json({
      code: "error",
        message: "Please provide OTP."
      });
      return;
    }

    // Atomically find and delete the OTP request to prevent race conditions
    const request = await EmailChangeRequest.findOneAndDelete({
      accountId: accountId,
      accountType: "company",
      otp: otp,
      expireAt: { $gt: new Date() }
    }).select('newEmail'); // Only need newEmail

    if (!request) {
      res.status(400).json({
      code: "error",
        message: "Invalid or expired OTP."
      });
      return;
    }

    // Update email in account
    await AccountCompany.updateOne(
      { _id: accountId },
      { email: request.newEmail }
    );

    await invalidateJobDiscoveryCaches();

    // Force re-login since JWT still contains old email
    res.clearCookie("token", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV == "production" ? true : false,
    });

    res.json({
      code: "success",
      message: "Email changed successfully! Please login again with your new email."
    });
  } catch (error) {
    if ((error as any).code === 11000) {
      res.status(409).json({ code: "error", message: "This email has already been taken by another account." });
      return;
    }
    res.status(500).json({
      code: "error",
      message: "Failed to verify email change."
    });
  }
}
