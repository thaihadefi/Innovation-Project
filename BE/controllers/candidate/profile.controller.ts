import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import EmailChangeRequest from "../../models/email-change-request.model";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { sendEmail } from "../../helpers/mail.helper";
import { emailTemplates } from "../../helpers/email-template.helper";
import { deleteImage } from "../../helpers/cloudinary.helper";

export const profilePatch = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;

    const needOldAvatar = !!req.file || req.body.avatar === null || req.body.avatar === "";

    // Run all uniqueness checks + old avatar fetch in parallel
    const [currentCandidate, existEmail, existPhone, existStudentId] = await Promise.all([
      needOldAvatar
        ? AccountCandidate.findById(candidateId).select('avatar').lean()
        : Promise.resolve(null),
      req.body.email !== undefined
        ? AccountCandidate.findOne({ _id: { $ne: candidateId }, email: req.body.email }).select('_id').lean()
        : Promise.resolve(null),
      req.body.phone !== undefined
        ? AccountCandidate.findOne({ _id: { $ne: candidateId }, phone: req.body.phone }).select('_id').lean()
        : Promise.resolve(null),
      req.body.studentId
        ? AccountCandidate.findOne({
            _id: { $ne: candidateId },
            studentId: req.body.studentId
          }).select('_id').lean()
        : Promise.resolve(null),
    ]);

    // Helper: cleanup uploaded avatar on early return
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

    if (existStudentId) {
      cleanupFile();
      res.status(409).json({
      code: "error",
      message: "Student ID already exists."
      })
      return;
    }

    const updateData: any = {};
    const isVerified = !!req.account.isVerified;

    // Prevent changes to verified fields after verification
    if (isVerified) {
      const blockedFields: Array<{ key: string; current: any; incoming: any; message: string }> = [
        { key: "fullName", current: req.account.fullName, incoming: req.body.fullName, message: "Full name cannot be changed after verification." },
        { key: "studentId", current: req.account.studentId, incoming: req.body.studentId, message: "Student ID cannot be changed after verification." },
        { key: "cohort", current: req.account.cohort, incoming: req.body.cohort, message: "Cohort cannot be changed after verification." },
        { key: "major", current: req.account.major, incoming: req.body.major, message: "Major cannot be changed after verification." }
      ];
      for (const field of blockedFields) {
        if (field.incoming !== undefined && field.incoming !== null && `${field.incoming}` !== `${field.current ?? ""}`) {
          cleanupFile();
          res.status(400).json({
      code: "error", message: field.message });
          return;
        }
      }
    }

    // Block email changes via profile patch — must use the OTP-based requestEmailChange flow
    if (req.body.email !== undefined && req.body.email !== req.account.email) {
      cleanupFile();
      res.status(400).json({ code: "error", message: "Email cannot be changed here. Please use the 'Change Email' button." });
      return;
    }

    if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.studentId !== undefined) updateData.studentId = req.body.studentId;
    if (req.body.cohort !== undefined && req.body.cohort !== "") updateData.cohort = Number(req.body.cohort);
    if (req.body.cohort === "") updateData.cohort = null;
    if (req.body.major !== undefined) updateData.major = req.body.major;

    if (req.body.skills !== undefined && typeof req.body.skills === 'string') {
      try {
        const parsed = JSON.parse(req.body.skills);
        const { normalizeSkills } = await import("../../helpers/skill.helper");
        const normalized = normalizeSkills(parsed);
        if (normalized.length === 0) {
          cleanupFile();
          res.status(400).json({ code: "error", message: "Please enter at least one valid skill." });
          return;
        }
        updateData.skills = normalized;
      } catch (err) {
        console.warn("[Candidate] Failed to parse skills payload");
        cleanupFile();
        res.status(400).json({ code: "error", message: "Invalid skills format." });
        return;
      }
    }

    if(req.file) {
      updateData.avatar = req.file.path;
    } else if (req.body.avatar === null || req.body.avatar === "") {
      updateData.avatar = null;
    }

    await AccountCandidate.updateOne({
      _id: candidateId
    }, updateData);

    // Delete old avatar after successful update when uploading a new one or removing it
    const oldAvatar = (currentCandidate as any)?.avatar as string | undefined;
    if (oldAvatar) {
      const isReplaced = req.file && oldAvatar !== req.file.path;
      const isRemoved = !req.file && (req.body.avatar === null || req.body.avatar === "");
      if (isReplaced || isRemoved) {
        void deleteImage(oldAvatar).catch((err) => console.error('[Cloudinary] Failed to delete:', err));
      }
    }
  
    res.json({
      code: "success",
      message: "Update successful."
    })
  } catch (error: any) {
    // Roll back Cloudinary upload if DB write failed
    if (req.file) {
      void deleteImage(req.file.path).catch((e) => console.error('[Cloudinary] Failed to delete orphaned upload:', e));
    }
    // Handle concurrent profile update race condition (unique index violation)
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || {})[0];
      const message =
        field === "studentId" ? "Student ID already exists." :
                                "Phone number already exists.";
      res.status(409).json({ code: "error", message });
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
      { accountId: accountId, accountType: "candidate" },
      { $set: { newEmail: newEmail, otp: otp, expireAt: expireAt } },
      { upsert: true }
    );

    // Send OTP to new email (critical) + security alert to current email (fire-and-forget)
    const { subject: otpSubject, html: otpHtml } = emailTemplates.emailChangeOtp(otp, newEmail);
    const { subject: alertSubject, html: alertHtml } = emailTemplates.emailChangeSecurityAlert(newEmail);
    try {
      await sendEmail(newEmail, otpSubject, otpHtml);
    } catch {
      await EmailChangeRequest.deleteOne({ accountId: accountId, accountType: "candidate" });
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
      accountType: "candidate",
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
    await AccountCandidate.updateOne(
      { _id: accountId },
      { email: request.newEmail }
    );

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
