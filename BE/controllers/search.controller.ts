import { Request, Response } from "express";
import mongoose from "mongoose";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import City from "../models/city.model";
import { convertToSlug } from "../helpers/slugify.helper";
import { normalizeTechnologyKey } from "../helpers/technology.helper";
import { paginationConfig } from "../config/variable";
import cache, { CACHE_TTL } from "../helpers/cache.helper";

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
      if (k === 'skill') s = normalizeTechnologyKey(s);
      // encode to avoid reserved chars
      parts.push(`${k}=${encodeURIComponent(s)}`);
    }
    return `search:${parts.join('&') || 'all'}`;
  };

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

  // Use indexed technologySlugs field for skill filter
  const skillInputRaw = req.query.skill;
  if(skillInputRaw) {
    const skillInput = String(skillInputRaw);
    const langKey = normalizeTechnologyKey(skillInput);
    const legacySlug = convertToSlug(skillInput);
    const languageKeys = [langKey, legacySlug].filter(Boolean);
    find.technologySlugs = languageKeys.length > 1 ? { $in: languageKeys } : langKey; // MongoDB will use index for this
  }

  if (req.query.location) {
    // Normalize incoming location param to slug format (remove diacritics/spacing)
    // City slugs in DB are normalized; convert user input the same way to improve matching.
    const cityParam = String(req.query.location);
    const citySlug = convertToSlug(cityParam);

    // Try to fetch cached city lookup first. Use normalized slug for cache key.
    const cityCacheKey = `city:slug:${citySlug}`;
    let city = cache.get<any>(cityCacheKey);
    if (!city) {
      // Try exact slug match first (fast, indexable)
      city = await City.findOne({ slug: citySlug }).select('_id').lean();

      // If not found, and slug may include a short unique suffix, try base slug prefix.
      if (!city) {
        const suffixMatch = citySlug.match(/-(?:[a-f0-9]{6})$/i);
        if (suffixMatch) {
          const baseSlug = citySlug.replace(/-(?:[a-f0-9]{6})$/i, '');
          city = await City.findOne({ slug: { $regex: `^${baseSlug}`, $options: 'i' } }).select('_id').lean();
        }
      }

      // Cache found city (longer TTL) or negative result (short TTL)
      if (city) {
        cache.set(cityCacheKey, city, CACHE_TTL.STATIC);
      } else {
        // Keep negative lookups short-lived in cache
        cache.set(cityCacheKey, null, CACHE_TTL.SHORT);
      }
    }
    if(city) {
      // Filter jobs that have this city in their cities array (indexed)
      // job.cities stores string IDs, but some records may store ObjectIds.
      const cityId = city._id.toString();
      find.cities = { $in: [cityId, city._id] };
    } else {
      // City not found - create an empty $in filter to return 0 results safely
      find.cities = { $in: [] };
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
    let rawKeyword = String(req.query.keyword);
    try {
      rawKeyword = decodeURIComponent(rawKeyword);
    } catch {
      // Keep raw string if decoding fails
    }
    const trimmedKeyword = rawKeyword.trim();
    // Require at least 1 alphanumeric to avoid empty/only-symbol searches
    if (!/[a-z0-9]/i.test(trimmedKeyword)) {
      res.json({
        code: "error",
        message: "Please enter at least 1 alphanumeric character."
      });
      return;
    }
    // Escape special regex characters to prevent errors
    const keyword = trimmedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keywordRegex = new RegExp(keyword, "i");
    
    // Find companies - select only _id
    const matchingCompanies = await AccountCompany.find({ companyName: keywordRegex })
      .select('_id')
      .lean();
    const matchingCompanyIds = matchingCompanies.map(c => new mongoose.Types.ObjectId(c._id));
    
    
    // Use regex for all fields (text search may crash with special chars)
    find.$or = [
      { title: keywordRegex },
      { description: keywordRegex },
      { technologies: keywordRegex },
      { position: keywordRegex },
      { workingForm: keywordRegex },
      ...(matchingCompanyIds.length > 0 ? [{ companyId: { $in: matchingCompanyIds } }] : [])
    ];
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
      .select('title slug salaryMin salaryMax position workingForm technologies technologySlugs cities images companyId createdAt maxApproved approvedCount expirationDate')
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
    .select('companyName slug logo city')
    .lean();
  const companyMap = new Map(companies.map(c => [c._id.toString(), c]));

  // Bulk fetch company cities (1 query instead of N)
  const companyCityIds = [...new Set(companies.map(c => c.city?.toString()).filter(Boolean))];
  // Select only needed city fields
  const companyCities = companyCityIds.length > 0 
    ? await City.find({ _id: { $in: companyCityIds } }).select('name slug').lean() 
    : [];
  const companyCityMap = new Map(companyCities.map((c: any) => [c._id.toString(), c]));

  // Bulk fetch all job cities (1 query instead of N)
  const allJobCityIds = [...new Set(
    jobs.flatMap(j => (j.cities || []) as any[])
      .map((id: any) => id?.toString?.() || id)
      .filter((id: any) => typeof id === 'string' && /^[a-f\d]{24}$/i.test(id))
  )];
  // Select only name field
  const jobCities = allJobCityIds.length > 0 
    ? await City.find({ _id: { $in: allJobCityIds } }).select('name').lean() 
    : [];
  const jobCityMap = new Map(jobCities.map((c: any) => [c._id.toString(), c.name]));

  // Build response using Maps for O(1) lookups
  for (const item of jobs) {
    const companyInfo = companyMap.get(item.companyId?.toString() || '');
    const cityInfo = companyInfo ? companyCityMap.get(companyInfo.city?.toString() || '') : null;
    
    // Resolve job cities to names from map
    const jobCityNames = ((item.cities || []) as any[])
      .map(cityId => jobCityMap.get(cityId?.toString?.() || cityId))
      .filter(Boolean) as string[];
    
    if(companyInfo) {
      // Check if job is full (maxApproved > 0 and approvedCount >= maxApproved)
      const maxApproved = item.maxApproved || 0;
      const approvedCount = item.approvedCount || 0;
      const maxApplications = item.maxApplications || 0;
      const applicationCount = item.applicationCount || 0;
      const isFull = maxApproved > 0 && approvedCount >= maxApproved;

      // Use technologySlugs from DB (already indexed and persisted)
      const technologySlugs = item.technologySlugs || [];

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
        companyCity: cityInfo?.name || "",
        companyCitySlug: cityInfo?.slug || "",
        jobCities: jobCityNames,
        technologies: item.technologies,
        technologySlugs: technologySlugs,
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
}
