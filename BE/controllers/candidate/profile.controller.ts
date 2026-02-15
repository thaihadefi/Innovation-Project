import { Response } from "express";
import { RequestAccount } from "../../interfaces/request.interface";
import AccountCandidate from "../../models/account-candidate.model";
import AccountCompany from "../../models/account-company.model";
import EmailChangeRequest from "../../models/email-change-request.model";
import { generateRandomNumber } from "../../helpers/generate.helper";
import { queueEmail } from "../../helpers/mail.helper";
import { deleteImage } from "../../helpers/cloudinary.helper";

export const profilePatch = async (req: RequestAccount, res: Response) => {
  try {
    const candidateId = req.account.id;
    const currentCandidate = req.file
      ? await AccountCandidate.findById(candidateId).select('avatar').lean()
      : null;

    const existEmail = await AccountCandidate.findOne({
      _id: { $ne: candidateId },
      email: req.body.email
    }).select('_id'); // Only check existence

    if(existEmail) {
      res.status(400).json({
      code: "error",
        message: "Email already exists."
      })
      return;
    }

    const existPhone = await AccountCandidate.findOne({
      _id: { $ne: candidateId },
      phone: req.body.phone
    }).select('_id'); // Only check existence

    if(existPhone) {
      res.status(400).json({
      code: "error",
        message: "Phone number already exists."
      })
      return;
    }

    // Check if studentId already exists (must be unique)
    if (req.body.studentId) {
      const existStudentId = await AccountCandidate.findOne({
        _id: { $ne: candidateId },
        studentId: req.body.studentId
      }).select('_id'); // Only check existence

      if (existStudentId) {
        res.status(400).json({
      code: "error",
          message: "Student ID already exists."
        })
        return;
      }
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
          res.status(400).json({
      code: "error", message: field.message });
          return;
        }
      }
    }

    if (req.body.fullName !== undefined) updateData.fullName = req.body.fullName;
    if (req.body.phone !== undefined) updateData.phone = req.body.phone;
    if (req.body.email !== undefined) updateData.email = req.body.email;
    if (req.body.studentId !== undefined) updateData.studentId = req.body.studentId;
    if (req.body.cohort !== undefined && req.body.cohort !== "") updateData.cohort = Number(req.body.cohort);
    if (req.body.cohort === "") updateData.cohort = null;
    if (req.body.major !== undefined) updateData.major = req.body.major;

    // Parse skills from JSON string if provided and normalize like skills
    if (req.body.skills !== undefined && typeof req.body.skills === 'string') {
      try {
        const parsed = JSON.parse(req.body.skills);
        // Normalize skills same as job skills
        const { normalizeSkills } = await import("../../helpers/skill.helper");
        updateData.skills = normalizeSkills(parsed);
      } catch (err) {
        console.warn("[Candidate] Failed to parse skills payload");
        updateData.skills = [];
      }
    }

    if(req.file) {
      updateData.avatar = req.file.path;
    }

    await AccountCandidate.updateOne({
      _id: candidateId
    }, updateData);

    // Delete old avatar after successful update when uploading a new one
    const oldAvatar = (currentCandidate as any)?.avatar as string | undefined;
    if (req.file && oldAvatar && oldAvatar !== req.file.path) {
      await deleteImage(oldAvatar);
    }
  
    res.json({
      code: "success",
      message: "Update successful."
    })
  } catch (error) {
    res.status(400).json({
      code: "error",
      message: "Invalid request data."
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
      res.status(400).json({
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
      res.status(400).json({
      code: "error",
        message: "This email is already registered."
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
    queueEmail(
      newEmail,
      "UITJobs - Email Change Verification",
      `<p>Your OTP code for email change is: <strong>${otp}</strong></p>
       <p>This code will expire in 10 minutes.</p>
       <p>If you did not request this, please ignore this email.</p>`
    );

    res.json({
      code: "success",
      message: "OTP sent to your new email."
    });
  } catch (error) {
    res.status(400).json({
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

    // Find pending request
    const request = await EmailChangeRequest.findOne({
      accountId: accountId,
      accountType: "candidate",
      otp: otp,
      expiredAt: { $gt: new Date() }
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

    // Delete the request
    await EmailChangeRequest.deleteOne({ _id: request._id });

    res.json({
      code: "success",
      message: "Email changed successfully! Please login again with your new email."
    });
  } catch (error) {
    res.status(400).json({
      code: "error",
      message: "Failed to verify email change."
    });
  }
}
