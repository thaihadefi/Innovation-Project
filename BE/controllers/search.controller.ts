import { Request, Response } from "express";
import Job from "../models/job.model";
import AccountCompany from "../models/account-company.model";
import City from "../models/city.model";
import { convertToSlug } from "../helpers/slugify.helper";
import { normalizeTechnologyName } from "../helpers/technology.helper";
import { paginationConfig } from "../config/variable";

export const search = async (req: Request, res: Response) => {
  const dataFinal = [];

  const find: any = {};

  // Use indexed technologySlugs field for language filter
  if(req.query.language) {
    const langSlug = convertToSlug(String(req.query.language));
    find.technologySlugs = langSlug; // MongoDB will use index for this
  }

  if(req.query.city) {
    // City slugs have ID suffix, so use regex to match prefix
    const citySlugRegex = new RegExp(`^${req.query.city}`);
    const city = await City.findOne({
      slug: { $regex: citySlugRegex }
    })
    if(city) {
      // Filter jobs that have this city in their cities array (indexed)
      find.cities = city.id;
    } else {
      // City not found - use impossible filter to return 0 results
      find.cities = "000000000000000000000000";
    }
  }

  if(req.query.company) {
    const accountCompany = await AccountCompany.findOne({
      slug: req.query.company
    })
    if(accountCompany) {
      find.companyId = accountCompany.id;
    } else {
      // Company not found - use impossible filter to return 0 results
      find.companyId = "000000000000000000000000";
    }
  }

  if(req.query.keyword) {
    // Decode URL-encoded keyword and escape regex special characters
    const rawKeyword = decodeURIComponent(req.query.keyword as string);
    // Escape special regex characters to prevent errors
    const keyword = rawKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const keywordRegex = new RegExp(keyword, "i");
    
    // Find companies matching keyword by name
    const matchingCompanies = await AccountCompany.find({ companyName: keywordRegex });
    const matchingCompanyIds = matchingCompanies.map(c => c.id);
    
    console.log("Keyword search:", rawKeyword, "| Matching companies:", matchingCompanies.length);
    
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

  // Count total documents matching filters
  const totalRecord = await Job.countDocuments(find);
  const totalPage = Math.max(1, Math.ceil(totalRecord / limit));

  // Execute optimized query with indexes and pagination
  const jobs = await Job
    .find(find)
    .sort({ createdAt: "desc" })
    .limit(limit)
    .skip(skip);

  for (const item of jobs) {
    const companyInfo = await AccountCompany.findOne({
      _id: item.companyId
    })
    const cityInfo = await City.findOne({
      _id: companyInfo?.city
    })
    
    // Resolve job cities to names (with error handling)
    let jobCityNames: string[] = [];
    try {
      if (item.cities && Array.isArray(item.cities) && item.cities.length > 0) {
        const validCityIds = (item.cities as string[]).filter(id => 
          typeof id === 'string' && /^[a-f\d]{24}$/i.test(id)
        );
        if (validCityIds.length > 0) {
          const jobCities = await City.find({ _id: { $in: validCityIds } });
          jobCityNames = jobCities.map((c: any) => c.name);
        }
      }
    } catch {
      jobCityNames = [];
    }
    
    if(companyInfo) {
      // Check if job is full (maxApproved > 0 and approvedCount >= maxApproved)
      const maxApproved = item.maxApproved || 0;
      const approvedCount = item.approvedCount || 0;
      const maxApplications = item.maxApplications || 0;
      const applicationCount = item.applicationCount || 0;
      const isFull = maxApproved > 0 && approvedCount >= maxApproved;

      // Use technologySlugs from DB (already indexed and persisted)
      const technologySlugs = item.technologySlugs || [];

      const itemFinal = {
        id: item.id,
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
        maxApplications: maxApplications,
        maxApproved: maxApproved,
        applicationCount: applicationCount,
        approvedCount: approvedCount
      };
      dataFinal.push(itemFinal);
    }
  }

  res.json({
    code: "success",
    message: "Success!",
    jobs: dataFinal,
    pagination: {
      totalRecord,
      totalPage,
      currentPage: page,
      pageSize: limit
    }
  });
}