import { isObjectId, isDuplicateKeyError } from "../../helpers/db.helper";
import { FilterQuery, Types } from "mongoose";
import AccountCompany from "../../models/account-company.model";
import FollowCompany from "../../models/follow-company.model";
import { paginationConfig } from "../../config/variable";
import { findIdsByKeyword } from "../../helpers/atlas-search.helper";
import { buildPagination, PaginationDTO } from "../../helpers/pagination.helper";
import { IFollowCompany } from "../../interfaces/models/follow-company.interface";
import { IAccountCompany } from "../../interfaces/models/account-company.interface";

export const toggleFollowCompanyService = async (
  candidateId: Types.ObjectId,
  companyId: string
): Promise<{ status: number; code: string; message: string; following?: boolean }> => {
  if (!isObjectId(companyId)) {
    return { status: 400, code: "error", message: "Invalid company." };
  }

  const company = await AccountCompany.findById(companyId).select("_id").lean();
  if (!company) {
    return { status: 404, code: "error", message: "Company not found." };
  }

  const existingFollow = await FollowCompany.findOne({
    candidateId,
    companyId: new Types.ObjectId(companyId)
  }).select("_id").lean<IFollowCompany>();

  if (existingFollow) {
    await FollowCompany.deleteOne({ _id: existingFollow._id });
    return { status: 200, code: "success", message: "Unfollowed successfully.", following: false };
  }

  try {
    const newFollow = new FollowCompany({
      candidateId,
      companyId: new Types.ObjectId(companyId)
    });
    await newFollow.save();
    return { status: 200, code: "success", message: "Followed successfully.", following: true };
  } catch (error) {
    if (isDuplicateKeyError(error)) {
      return { status: 200, code: "success", message: "Followed successfully.", following: true };
    }
    throw error;
  }
};

export const checkFollowStatusService = async (
  candidateId: Types.ObjectId,
  companyId: string
): Promise<{ code: string; following: boolean }> => {
  const existingFollow = await FollowCompany.findOne({
    candidateId,
    companyId: new Types.ObjectId(companyId)
  }).select("_id").lean();

  return { code: "success", following: !!existingFollow };
};

export const getFollowedCompaniesService = async (
  candidateId: Types.ObjectId,
  page: number,
  keyword: string
): Promise<{ code: string; companies: unknown[]; pagination: PaginationDTO }> => {
  const pageSize = paginationConfig.candidateFollowedCompanies || 9;
  const skip = (page - 1) * pageSize;

  const followFilter: FilterQuery<IFollowCompany> = { candidateId };
  if (keyword) {
    const atlasIds = await findIdsByKeyword({ model: AccountCompany, keyword, atlasPaths: ["companyName", "slug"] }).catch(() => [] as string[]);
    if (atlasIds.length === 0) {
      return {
        code: "success",
        companies: [],
        pagination: buildPagination(0, page, pageSize),
      };
    }
    followFilter.companyId = { $in: atlasIds.map(id => new Types.ObjectId(id)) };
  }

  const [totalRecord, follows] = await Promise.all([
    FollowCompany.countDocuments(followFilter),
    FollowCompany.find(followFilter)
      .select("companyId createdAt")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean<IFollowCompany[]>()
  ]);

  const followedIds = follows.map(f => f.companyId?.toString()).filter(Boolean);
  const companies = followedIds.length > 0
    ? await AccountCompany.find({ _id: { $in: followedIds }, status: "active" })
        .select("companyName logo slug")
        .lean<IAccountCompany[]>()
    : [];
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));
  const orderedCompanies = followedIds
    .map(id => companyMap.get(id))
    .filter(Boolean);

  return {
    code: "success",
    companies: orderedCompanies,
    pagination: buildPagination(totalRecord, page, pageSize),
  };
};
