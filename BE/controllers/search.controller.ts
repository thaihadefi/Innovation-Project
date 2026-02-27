import { Request, Response } from "express";
import mongoose from "mongoose";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import Location from "../models/location.model";
import { convertToSlug } from "../helpers/slugify.helper";
import { normalizeSkillKey } from "../helpers/skill.helper";
import { paginationConfig } from "../config/variable";
import cache, { CACHE_TTL } from "../helpers/cache.helper";
import { decodeQueryValue } from "../helpers/query.helper";
import { findIdsByKeyword } from "../helpers/atlas-search.helper";
import {
  findLocationByNormalizedSlug,
  normalizeLocationSlug,
} from "../helpers/location.helper";

export const search = async (req: Request, res: Response) => {
  // Generate a canonical cache key from query params (stable order, normalized values)
  const makeSearchCacheKey = (q: any) => {
    const keys = ['location','keyword','position','workingForm','skill','company','page','limit'];
    const parts: string[] = [];
    for (const k of keys) {
      const v = q[k];
      if (v === undefined || v === null) continue;
      let s = String(v).trim();
      if (s === '') continue;
      // Normalize location/skill to canonical key form to make cache keys consistent
      if (k === 'location') s = convertToSlug(s);
      if (k === 'skill') s = normalizeSkillKey(s);
      // encode to avoid reserved chars
      parts.push(`${k}=${encodeURIComponent(s)}`);
    }
    return `search:${parts.join('&') || 'all'}`;
  };

  try {
  const cacheKey = makeSearchCacheKey(req.query);
  const cached = cache.get<any>(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const dataFinal = [];

  // Base filter: exclude expired jobs
  const expirationFilter = {
    $or: [
      { expirationDate: null },
      { expirationDate: { $exists: false } },
      { expirationDate: { $gt: new Date() } }
    ]
  };

  const find: any = {};

  // Use indexed skillSlugs field for skill filter
  const skillInputRaw = req.query.skill;
  if(skillInputRaw) {
    const skillInput = String(skillInputRaw);
    const langKey = normalizeSkillKey(skillInput);
    const legacySlug = convertToSlug(skillInput);
    const languageKeys = [langKey, legacySlug].filter(Boolean);
    find.skillSlugs = languageKeys.length > 1 ? { $in: languageKeys } : langKey; // MongoDB will use index for this
  }

  if (req.query.location) {
    // Normalize incoming location param to slug format (remove diacritics/spacing)
    // Location slugs in DB are normalized; convert user input the same way to improve matching.
    const locationSlug = normalizeLocationSlug(req.query.location);

    // Try to fetch cached location lookup first. Use normalized slug for cache key.
    const locationCacheKey = `location:slug:${locationSlug}`;
    let location = cache.get<any>(locationCacheKey);
    if (!location) {
      location = await findLocationByNormalizedSlug(locationSlug);

      // Cache found location (longer TTL) or negative result (short TTL)
      if (location) {
        cache.set(locationCacheKey, location, CACHE_TTL.STATIC);
      } else {
        // Keep negative lookups short-lived in cache
        cache.set(locationCacheKey, null, CACHE_TTL.SHORT);
      }
    }
    if(location) {
      // Filter jobs that have this location in their locations array (indexed)
      // job.locations stores string IDs, but some records may store ObjectIds.
      const locationId = location._id.toString();
      find.locations = { $in: [locationId, location._id] };
    } else {
      // Location not found - create an empty $in filter to return 0 results safely
      find.locations = { $in: [] };
    }
  }

  if(req.query.company) {
    // Select only _id field
    const accountCompany = await AccountCompany.findOne({
      slug: req.query.company
    }).select('_id').lean();
    if(accountCompany) {
      find.companyId = new mongoose.Types.ObjectId(accountCompany._id);
    } else {
      // Company not found - use impossible filter to return 0 results
      find.companyId = new mongoose.Types.ObjectId("000000000000000000000000");
    }
  }

  if (req.query.keyword) {
    // Decode URL-encoded keyword safely
    const trimmedKeyword = decodeQueryValue(req.query.keyword);
    // Require at least 1 letter/number (Unicode-aware) to avoid empty/only-symbol searches
    if (!/[\p{L}\p{N}]/u.test(trimmedKeyword)) {
      res.status(400).json({
      code: "error",
        message: "Please enter at least 1 alphanumeric character."
      });
      return;
    }
    const keywordLength = Array.from(trimmedKeyword).length;
    // Best-practice gating: keep 1-char queries focused; broaden only when query has enough intent.
    const allowBroadTextMatch = keywordLength >= 2;
    const allowCompanyMatch = keywordLength >= 3;

    const keywordJobFields = allowBroadTextMatch
      ? ["title", "skills", "description", "position", "workingForm"]
      : ["title", "skills"];

    const keywordMatchedJobIds = await findIdsByKeyword({
      model: Job,
      keyword: trimmedKeyword,
      atlasPaths: keywordJobFields,
      limit: 5000,
    });

    let matchingCompanyIds: string[] = [];
    if (allowCompanyMatch) {
      matchingCompanyIds = await findIdsByKeyword({
        model: AccountCompany,
        keyword: trimmedKeyword,
        atlasPaths: "companyName",
        limit: 2000,
      });
    }

    const matchedJobIdsSet = new Set(keywordMatchedJobIds);
    if (matchingCompanyIds.length > 0) {
      const jobsByCompany = await Job.find({
        companyId: { $in: matchingCompanyIds },
      })
        .select("_id")
        .limit(5000)
        .lean();
      jobsByCompany.forEach((job: any) => matchedJobIdsSet.add(job._id.toString()));
    }

    find._id = { $in: Array.from(matchedJobIdsSet) };
  }

  if(req.query.position) {
    find.position = req.query.position;
  }

  if(req.query.workingForm) {
    find.workingForm = req.query.workingForm;
  }

  // Pagination: page & limit
  const page = req.query.page && parseInt(String(req.query.page)) > 0 ? parseInt(String(req.query.page)) : 1;
  // Use server-side default from config and enforce a max cap to avoid large queries
  const defaultLimit = paginationConfig?.searchResults || 10;
  const maxLimit = paginationConfig?.maxPageSize || 50;
  let limit = req.query.limit && parseInt(String(req.query.limit)) > 0 ? parseInt(String(req.query.limit)) : defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  const skip = (page - 1) * limit;

  // Build final query with expiration filter
  const finalQuery = {
    $and: [
      expirationFilter,
      find
    ]
  };

  // Execute count and find in parallel (independent queries)
  const [totalRecord, jobs] = await Promise.all([
    Job.countDocuments(finalQuery),
    // Select only needed fields
    Job.find(finalQuery)
      .select('title slug salaryMin salaryMax position workingForm skills skillSlugs locations images companyId createdAt maxApproved approvedCount expirationDate')
      .sort({ createdAt: "desc" })
      .limit(limit)
      .skip(skip)
      .lean()
  ]);
  const totalPage = Math.max(1, Math.ceil(totalRecord / limit));

  // Bulk fetch all companies (1 query instead of N)
  const companyIds = [...new Set(jobs.map(j => j.companyId?.toString()).filter(Boolean))];
  // Select only needed company fields
  const companies = await AccountCompany.find({ _id: { $in: companyIds } })
    .select('companyName slug logo location')
    .lean();
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

  // Bulk fetch company locations (1 query instead of N)
  const companyLocationIds = [...new Set(companies.map(c => c.location?.toString()).filter(Boolean))];
  // Select only needed location fields
  const companyLocations = companyLocationIds.length > 0 
    ? await Location.find({ _id: { $in: companyLocationIds } }).select('name slug').lean() 
    : [];
  const companyLocationMap = new Map(companyLocations.map((c: any) => [c._id.toString(), c]));

  // Bulk fetch all job locations (1 query instead of N)
  const allJobLocationIds = [...new Set(
    jobs.flatMap(j => (j.locations || []) as any[])
      .map((id: any) => id?.toString?.() || id)
      .filter((id: any) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
  )];
  // Select only name field
  const jobLocations = allJobLocationIds.length > 0 
    ? await Location.find({ _id: { $in: allJobLocationIds } }).select('name').lean() 
    : [];
  const jobLocationMap = new Map(jobLocations.map((c: any) => [c._id.toString(), c.name]));

  // Build response using Maps for O(1) lookups
  for (const item of jobs) {
    const companyInfo = companyMap.get(item.companyId?.toString() || '');
    const locationInfo = companyInfo ? companyLocationMap.get(companyInfo.location?.toString() || '') : null;
    
    // Resolve job locations to names from map
    const jobLocationNames = ((item.locations || []) as any[])
      .map(locationId => jobLocationMap.get(locationId?.toString?.() || locationId))
      .filter(Boolean) as string[];
    
    if(companyInfo) {
      // Check if job is full (maxApproved > 0 and approvedCount >= maxApproved)
      const maxApproved = item.maxApproved || 0;
      const approvedCount = item.approvedCount || 0;
      const maxApplications = item.maxApplications || 0;
      const applicationCount = item.applicationCount || 0;
      const isFull = maxApproved > 0 && approvedCount >= maxApproved;

      // Use skillSlugs from DB (already indexed and persisted)
      const skillSlugs = item.skillSlugs || [];

      // Check if expired
      const isExpired = item.expirationDate 
        ? new Date(item.expirationDate) < new Date()
        : false;

      const itemFinal = {
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
        skills: item.skills,
        skillSlugs: skillSlugs,
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

  const response = {
    code: "success",
    message: "Success.",
    jobs: dataFinal,
    pagination: {
      totalRecord,
      totalPage,
      currentPage: page,
      pageSize: limit
    }
  };

  // Cache results for 1 minute
  cache.set(cacheKey, response, CACHE_TTL.SHORT);

  res.json(response);
  } catch (error) {
    res.status(500).json({ code: "error", message: "Internal server error." });
  }
}
