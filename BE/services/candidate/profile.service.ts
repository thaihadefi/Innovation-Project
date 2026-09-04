import { Types } from "mongoose";
import { isDuplicateKeyError } from "../../helpers/db.helper";
import AccountCandidate from "../../models/account-candidate.model";
import { deleteImage, cleanupReplacedMedia } from "../../helpers/cloudinary.helper";
import { normalizeSkills } from "../../helpers/skill.helper";
import { requestEmailChangeFlow, verifyEmailChangeOtpFlow } from "../../helpers/email-change.helper";
import { IAccountCandidate } from "../../interfaces/models/account-candidate.interface";

export interface CandidateProfileUpdateDTO {
  fullName?: string;
  phone?: string;
  email?: string;
  studentId?: string;
  cohort?: number | string;
  major?: string;
  skills?: string;
  avatar?: string | null;
}

export const updateCandidateProfileService = async (
  candidate: IAccountCandidate,
  body: CandidateProfileUpdateDTO,
  file?: { path: string }
): Promise<{ status: number; code: string; message: string }> => {
  const candidateId = candidate._id;
  const needOldAvatar = !!file || body.avatar === null || body.avatar === "";

  const cleanupFile = () => {
    if (file) void deleteImage(file.path).catch(() => {});
  };

  const [currentCandidate, existEmail, existPhone, existStudentId] = await Promise.all([
    needOldAvatar
      ? AccountCandidate.findById(candidateId).select("avatar").lean<Pick<IAccountCandidate, "avatar">>()
      : Promise.resolve(null),
    body.email !== undefined
      ? AccountCandidate.findOne({ _id: { $ne: candidateId }, email: body.email }).select("_id").lean()
      : Promise.resolve(null),
    body.phone !== undefined
      ? AccountCandidate.findOne({ _id: { $ne: candidateId }, phone: body.phone }).select("_id").lean()
      : Promise.resolve(null),
    body.studentId
      ? AccountCandidate.findOne({ _id: { $ne: candidateId }, studentId: body.studentId }).select("_id").lean()
      : Promise.resolve(null),
  ]);

  if (existEmail) {
    cleanupFile();
    return { status: 409, code: "error", message: "Email already exists." };
  }

  if (existPhone) {
    cleanupFile();
    return { status: 409, code: "error", message: "Phone number already exists." };
  }

  if (existStudentId) {
    cleanupFile();
    return { status: 409, code: "error", message: "Student ID already exists." };
  }

  const updateData: Partial<IAccountCandidate> = {};
  const isVerified = !!candidate.isVerified;

  if (isVerified) {
    const blockedFields: Array<{ key: string; current: unknown; incoming: unknown; message: string }> = [
      { key: "fullName", current: candidate.fullName, incoming: body.fullName, message: "Full name cannot be edited after student verification." },
      { key: "studentId", current: candidate.studentId, incoming: body.studentId, message: "Student ID cannot be edited after student verification." },
      { key: "cohort", current: candidate.cohort, incoming: body.cohort, message: "Cohort cannot be edited after student verification." },
      { key: "major", current: candidate.major, incoming: body.major, message: "Major cannot be edited after student verification." },
    ];

    for (const { current, incoming, message } of blockedFields) {
      if (incoming !== undefined && String(incoming).trim() !== String(current ?? "").trim()) {
        cleanupFile();
        return { status: 403, code: "error", message };
      }
    }
  } else {
    if (body.fullName !== undefined) updateData.fullName = body.fullName;
    if (body.studentId !== undefined) updateData.studentId = body.studentId;
    if (body.cohort !== undefined) {
      const parsedCohort = Number(body.cohort);
      if (!isNaN(parsedCohort)) updateData.cohort = parsedCohort;
    }
    if (body.major !== undefined) updateData.major = body.major;
  }

  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.skills !== undefined) {
    const parsedSkills = normalizeSkills(body.skills);
    updateData.skills = parsedSkills;
  }

  if (file) {
    updateData.avatar = file.path;
  } else if (body.avatar === null || body.avatar === "") {
    updateData.avatar = "";
  }

  try {
    await AccountCandidate.updateOne({ _id: candidateId }, updateData);

    cleanupReplacedMedia(
      currentCandidate?.avatar,
      file?.path,
      body.avatar === null || body.avatar === ""
    );

    return { status: 200, code: "success", message: "Update successful." };
  } catch (error: unknown) {
    cleanupFile();
    const err = error as { code?: number; keyValue?: Record<string, unknown> };
    if (err.code === 11000) {
      const field = Object.keys(err.keyValue || {})[0];
      const message = field === "studentId" ? "Student ID already exists." : "Phone number already exists.";
      return { status: 409, code: "error", message };
    }
    throw error;
  }
};

export const requestCandidateEmailChangeService = async (
  candidate: IAccountCandidate,
  newEmail: string
): Promise<{ status: number; code: string; message: string }> => {
  return requestEmailChangeFlow({
    accountId: candidate._id,
    currentEmail: candidate.email,
    newEmail,
    accountType: "candidate",
  });
};

export const verifyCandidateEmailChangeService = async (
  candidateId: Types.ObjectId,
  otp: string
): Promise<{ status: number; code: string; message: string }> => {
  const result = await verifyEmailChangeOtpFlow(candidateId, otp, "candidate");
  if (!result.success) {
    return { status: 400, code: "error", message: result.message };
  }

  try {
    await AccountCandidate.updateOne({ _id: candidateId }, { email: result.newEmail });
    return {
      status: 200,
      code: "success",
      message: "Email changed successfully! Please login again with your new email.",
    };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { status: 409, code: "error", message: "This email has already been taken by another account." };
    }
    throw error;
  }
};
