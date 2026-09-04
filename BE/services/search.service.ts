import mongoose, { FilterQuery, Types } from "mongoose";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import Location from "../models/location.model";
import { convertToSlug } from "../helpers/slugify.helper";
import { normalizeSkillKey } from "../helpers/skill.helper";
import { paginationConfig, searchScanLimits } from "../config/variable";
import cache, { CACHE_TTL } from "../helpers/cache.helper";
import { findIdsByKeyword } from "../helpers/atlas-search.helper";
import {
  findLocationByNormalizedSlug,
  normalizeLocationSlug,
} from "../helpers/location.helper";
import { buildPagination, PaginationDTO, parsePage, parsePageSize } from "../helpers/pagination.helper";
import { IJob } from "../interfaces/models/job.interface";
import { IAccountCompany } from "../interfaces/models/account-company.interface";
import { ILocation } from "../interfaces/models/location.interface";

export interface SearchQueryDTO {
  location?: unknown;
  keyword?: unknown;
  position?: unknown;
  workingForm?: unknown;
  skill?: unknown;
  company?: unknown;
  page?: unknown;
  limit?: unknown;
}

export interface SearchJobItemDTO {
  id: Types.ObjectId;
  slug: string;
  companyLogo?: string;
  title: string;
  companyName: string;
  companySlug?: string;
  salaryMin?: number;
  salaryMax?: number;
  position?: string;
  workingForm?: string;
  companyLocation: string;
  companyLocationSlug: string;
  jobLocations: string[];
  skills: string[];
  createdAt: Date;
  isFull: boolean;
  isExpired: boolean;
  expirationDate: Date | null;
  maxApplications: number;
  maxApproved: number;
  applicationCount: number;
  approvedCount: number;
}

export interface SearchResultDTO {
  code: string;
  message: string;
  jobs: SearchJobItemDTO[];
  pagination: PaginationDTO;
}

export const makeSearchCacheKey = (q: SearchQueryDTO): string => {
  const keys: (keyof SearchQueryDTO)[] = ["location", "keyword", "position", "workingForm", "skill", "company", "page", "limit"];
  const parts: string[] = [];
  for (const k of keys) {
    const v = q[k];
    if (v === undefined || v === null) continue;
    let s = String(v).trim();
    if (s === "") continue;
    if (k === "location") s = convertToSlug(s);
    if (k === "skill") s = normalizeSkillKey(s);
    parts.push(`${k}=${encodeURIComponent(s)}`);
  }
  return `search:${parts.join("&") || "all"}`;
};

export const executeJobSearch = async (
  query: SearchQueryDTO
): Promise<{ error?: string; status?: number; data?: SearchResultDTO }> => {
  const cacheKey = makeSearchCacheKey(query);
  const cached = cache.get<SearchResultDTO>(cacheKey);
  if (cached) {
    return { data: cached };
  }

  const expirationFilter = {
    $or: [
      { expirationDate: null },
      { expirationDate: { $exists: false } },
      { expirationDate: { $gt: new Date() } }
    ]
  };

  const find: FilterQuery<IJob> = {};

  const skillInputRaw = query.skill;
  if (skillInputRaw) {
    const skillInput = String(skillInputRaw);
    const langKey = normalizeSkillKey(skillInput);
    const legacySlug = convertToSlug(skillInput);
    const languageKeys = [langKey, legacySlug].filter(Boolean);
    find.skills = languageKeys.length > 1 ? { $in: languageKeys } : langKey;
  }

  if (query.location) {
    const locationSlug = normalizeLocationSlug(String(query.location));
    const locationCacheKey = `location:slug:${locationSlug}`;
    let location = cache.get<{ _id: Types.ObjectId } | null>(locationCacheKey);
    if (location === undefined) {
      location = await findLocationByNormalizedSlug(locationSlug);
      if (location) {
        cache.set(locationCacheKey, location, CACHE_TTL.STATIC);
      } else {
        cache.set(locationCacheKey, null, CACHE_TTL.SHORT);
      }
    }
    if (location) {
      find.locations = { $in: [location._id] };
    } else {
      find.locations = { $in: [] };
    }
  }

  if (query.company) {
    const accountCompany = await AccountCompany.findOne({
      slug: String(query.company)
    })
      .select("_id")
      .lean<Pick<IAccountCompany, "_id">>();
    if (accountCompany) {
      find.companyId = new mongoose.Types.ObjectId(accountCompany._id);
    } else {
      find.companyId = new mongoose.Types.ObjectId("000000000000000000000000");
    }
  }

  if (query.keyword) {
    const trimmedKeyword = String(query.keyword || "").trim();
    if (!/[\p{L}\p{N}]/u.test(trimmedKeyword)) {
      return {
        error: "Please enter at least 1 alphanumeric character.",
        status: 400
      };
    }

    const [keywordMatchedJobIds, matchingCompanyIds] = await Promise.all([
      findIdsByKeyword({
        model: Job,
        keyword: trimmedKeyword,
        atlasPaths: ["title", "description", "position", "workingForm"],
        limit: searchScanLimits.jobKeywordAtlas
      }).catch(() => [] as string[]),
      findIdsByKeyword({
        model: AccountCompany,
        keyword: trimmedKeyword,
        atlasPaths: ["companyName", "slug"],
        limit: searchScanLimits.companyKeywordAtlas
      }).catch(() => [] as string[]),
    ]);

    const matchedJobIdsSet = new Set<string>(keywordMatchedJobIds);

    if (matchingCompanyIds.length > 0) {
      const jobsByCompany = await Job.find({
        companyId: { $in: matchingCompanyIds }
      })
        .select("_id")
        .limit(searchScanLimits.jobMongoScan)
        .lean<Pick<IJob, "_id">[]>();
      jobsByCompany.forEach(job => matchedJobIdsSet.add(job._id.toString()));
    }

    find._id = { $in: Array.from(matchedJobIdsSet).map(id => new Types.ObjectId(id)) };
  }

  if (query.position) {
    find.position = String(query.position);
  }

  if (query.workingForm) {
    find.workingForm = String(query.workingForm);
  }

  const page = parsePage(query.page);
  const limit = parsePageSize(query.limit, paginationConfig?.searchResults || 10, paginationConfig?.maxPageSize || 50);
  const skip = (page - 1) * limit;

  const BANNED_COMPANIES_CACHE_KEY = "banned_company_ids";
  const cachedBannedIds = cache.get<Types.ObjectId[]>(BANNED_COMPANIES_CACHE_KEY);
  let bannedCompanyIds: Types.ObjectId[];
  if (cachedBannedIds !== undefined) {
    bannedCompanyIds = cachedBannedIds;
  } else {
    const bannedCompanies = await AccountCompany.find({ status: { $ne: "active" } })
      .select("_id")
      .lean<Pick<IAccountCompany, "_id">[]>();
    bannedCompanyIds = bannedCompanies.map(c => c._id);
    cache.set(BANNED_COMPANIES_CACHE_KEY, bannedCompanyIds, CACHE_TTL.DYNAMIC);
  }

  const finalQuery: FilterQuery<IJob> = {
    $and: [
      expirationFilter,
      find,
      ...(bannedCompanyIds.length > 0 ? [{ companyId: { $nin: bannedCompanyIds } }] : []),
    ]
  };

  const [totalRecord, jobs] = await Promise.all([
    Job.countDocuments(finalQuery),
    Job.find(finalQuery)
      .select("title slug salaryMin salaryMax position workingForm skills locations images companyId createdAt maxApproved approvedCount expirationDate")
      .sort({ createdAt: "desc" })
      .limit(limit)
      .skip(skip)
      .lean<IJob[]>()
  ]);

  const companyIds = [...new Set(jobs.map(j => j.companyId?.toString()).filter(Boolean))];
  const companies = await AccountCompany.find({ _id: { $in: companyIds } })
    .select("companyName slug logo location")
    .lean<IAccountCompany[]>();
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

  const companyLocationIds = [...new Set(companies.map(c => c.location?.toString()).filter(Boolean))];
  const companyLocations = companyLocationIds.length > 0
    ? await Location.find({ _id: { $in: companyLocationIds } })
        .select("name slug")
        .lean<ILocation[]>()
    : [];
  const companyLocationMap = new Map(companyLocations.map(c => [c._id.toString(), c]));

  const allJobLocationIds = [...new Set(
    jobs.flatMap(j => (j.locations || []))
      .map(id => id?.toString?.() || id)
      .filter((id): id is string => typeof id === "string" && /^[a-f\d]{24}$/i.test(id))
  )];
  const jobLocations = allJobLocationIds.length > 0
    ? await Location.find({ _id: { $in: allJobLocationIds } })
        .select("name")
        .lean<Pick<ILocation, "_id" | "name">[]>()
    : [];
  const jobLocationMap = new Map(jobLocations.map(c => [c._id.toString(), c.name]));

  const dataFinal: SearchJobItemDTO[] = [];

  for (const item of jobs) {
    const companyInfo = companyMap.get(item.companyId?.toString() || "");
    const locationInfo = companyInfo ? companyLocationMap.get(companyInfo.location?.toString() || "") : null;

    const jobLocationNames = (item.locations || [])
      .map(locationId => jobLocationMap.get(locationId?.toString?.() || String(locationId)))
      .filter((name): name is string => Boolean(name));

    if (companyInfo) {
      const maxApproved = item.maxApproved || 0;
      const approvedCount = item.approvedCount || 0;
      const maxApplications = item.maxApplications || 0;
      const applicationCount = item.applicationCount || 0;
      const isFull = maxApproved > 0 && approvedCount >= maxApproved;

      const skills = item.skills || [];
      const isExpired = item.expirationDate
        ? new Date(item.expirationDate) < new Date()
        : false;

      const itemFinal: SearchJobItemDTO = {
        id: item._id,
        slug: item.slug,
        companyLogo: companyInfo.logo,
        title: item.title,
        companyName: companyInfo.companyName,
        companySlug: companyInfo.slug,
        salaryMin: item.salaryMin,
        salaryMax: item.salaryMax,
        position: item.position,
        workingForm: item.workingForm,
        companyLocation: locationInfo?.name || "",
        companyLocationSlug: locationInfo?.slug || "",
        jobLocations: jobLocationNames,
        skills: skills,
        createdAt: item.createdAt,
        isFull: isFull,
        isExpired: isExpired,
        expirationDate: item.expirationDate || null,
        maxApplications: maxApplications,
        maxApproved: maxApproved,
        applicationCount: applicationCount,
        approvedCount: approvedCount
      };
      dataFinal.push(itemFinal);
    }
  }

  const response: SearchResultDTO = {
    code: "success",
    message: "Success.",
    jobs: dataFinal,
    pagination: buildPagination(totalRecord, page, limit),
  };

  cache.set(cacheKey, response, CACHE_TTL.SHORT);
  return { data: response };
};
