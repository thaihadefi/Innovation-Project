import { Types } from "mongoose";
import AccountCompany from "../../models/account-company.model";
import { deleteImage, cleanupReplacedMedia } from "../../helpers/cloudinary.helper";
import { invalidateJobDiscoveryCaches } from "../../helpers/cache-invalidation.helper";
import { requestEmailChangeFlow, verifyEmailChangeOtpFlow } from "../../helpers/email-change.helper";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";

export interface CompanyProfileUpdateDTO {
  companyName?: string;
  phone?: string;
  email?: string;
  location?: string;
  address?: string;
  companyModel?: string;
  companyEmployees?: string;
  workingTime?: string;
  workOverTime?: string;
  description?: string;
  logo?: string | null;
}

export const updateCompanyProfileService = async (
  company: IAccountCompany,
  body: CompanyProfileUpdateDTO,
  file?: { path: string }
): Promise<{ status: number; code: string; message: string }> => {
  const companyId = company._id;
  const needOldLogo = !!file || body.logo === null || body.logo === "";

  const cleanupFile = () => {
    if (file) void deleteImage(file.path).catch(() => {});
  };

  const [currentCompany, existEmail, existPhone] = await Promise.all([
    needOldLogo
      ? AccountCompany.findById(companyId).select("logo").lean<Pick<IAccountCompany, "logo">>()
      : Promise.resolve(null),
    body.email !== undefined
      ? AccountCompany.findOne({ _id: { $ne: companyId }, email: body.email }).select("_id").lean()
      : Promise.resolve(null),
    body.phone !== undefined
      ? AccountCompany.findOne({ _id: { $ne: companyId }, phone: body.phone }).select("_id").lean()
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

  const updateData: Partial<IAccountCompany> = {};

  if (body.companyName !== undefined) updateData.companyName = body.companyName;
  if (body.phone !== undefined) updateData.phone = body.phone;
  if (body.location !== undefined) updateData.location = body.location;
  if (body.address !== undefined) updateData.address = body.address;
  if (body.companyModel !== undefined) updateData.companyModel = body.companyModel;
  if (body.companyEmployees !== undefined) updateData.companyEmployees = body.companyEmployees;
  if (body.workingTime !== undefined) updateData.workingTime = body.workingTime;
  if (body.workOverTime !== undefined) updateData.workOverTime = body.workOverTime;
  if (body.description !== undefined) updateData.description = body.description;

  if (file) {
    updateData.logo = file.path;
  } else if (body.logo === null || body.logo === "") {
    updateData.logo = "";
  }

  try {
    await AccountCompany.updateOne({ _id: companyId }, updateData);
    await invalidateJobDiscoveryCaches();

    cleanupReplacedMedia(
      currentCompany?.logo,
      file?.path,
      body.logo === null || body.logo === ""
    );

    return { status: 200, code: "success", message: "Update successful." };
  } catch (error: unknown) {
    cleanupFile();
    const err = error as { code?: number };
    if (err.code === 11000) {
      return { status: 409, code: "error", message: "Phone number already exists." };
    }
    throw error;
  }
};

export const requestCompanyEmailChangeService = async (
  company: IAccountCompany,
  newEmail: string
): Promise<{ status: number; code: string; message: string }> => {
  return requestEmailChangeFlow({
    accountId: company._id,
    currentEmail: company.email,
    newEmail,
    accountType: "company",
  });
};

export const verifyCompanyEmailChangeService = async (
  companyId: Types.ObjectId,
  otp: string
): Promise<{ status: number; code: string; message: string }> => {
  const result = await verifyEmailChangeOtpFlow(companyId, otp, "company");
  if (!result.success) {
    return { status: 400, code: "error", message: result.message };
  }

  try {
    await AccountCompany.updateOne({ _id: companyId }, { email: result.newEmail });
    await invalidateJobDiscoveryCaches();
    return {
      status: 200,
      code: "success",
      message: "Email changed successfully! Please login again with your new email.",
    };
  } catch (error: unknown) {
    const err = error as { code?: number };
    if (err.code === 11000) {
      return { status: 409, code: "error", message: "This email has already been taken by another account." };
    }
    throw error;
  }
};
