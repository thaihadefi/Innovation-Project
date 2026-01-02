import { Request, Response } from "express";
import City from "../models/city.model";
import AccountCompany from "../models/account-company.model";
import Job from "../models/job.model";
import cache, { CACHE_TTL } from "../helpers/cache.helper";

export const topCities = async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = "top_cities";
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get only active jobs (not expired)
    const allJobs = await Job.find({
      $or: [
        { expirationDate: { $exists: false } },
        { expirationDate: null },
        { expirationDate: { $gte: new Date() } }
      ]
    });

    // Count jobs by city using the job.cities array (job may list multiple city IDs)
    const cityJobCount: { [key: string]: number } = {};
    allJobs.forEach(job => {
      if (Array.isArray(job.cities)) {
        job.cities.forEach((cityId: any) => {
          if (cityId) {
            cityJobCount[cityId] = (cityJobCount[cityId] || 0) + 1;
          }
        });
      }
    });
    
    // OPTIMIZED: Batch fetch all cities instead of N+1 queries
    const cityIds = Object.keys(cityJobCount);
    const cities = await City.find({ _id: { $in: cityIds } });
    const cityMap = new Map(cities.map((c: any) => [c._id.toString(), c]));
    
    // Build top cities array with O(1) lookup
    const topCities = cityIds.map(cityId => {
      const city = cityMap.get(cityId);
      if (!city) return null;
      return {
        id: city.id,
        name: city.name,
        slug: city.slug,
        jobCount: cityJobCount[cityId]
      };
    }).filter(Boolean);
    
    // Sort by job count descending, then by name ascending when count equal
    topCities.sort((a: any, b: any) => b.jobCount - a.jobCount || (a.name || "").localeCompare(b.name || "", "vi"));
    
    const response = {
      code: "success",
      topCities: topCities.slice(0, 5) // Top 5 cities
    };

    // Cache for 30 minutes (static data)
    cache.set(cacheKey, response, CACHE_TTL.STATIC);

    res.json(response);
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to fetch top cities"
    });
  }
}

export const list = async (req: Request, res: Response) => {
  const cityList = await City.find({});

  res.json({
    code: "success",
    message: "Success!",
    cityList: cityList
  })
}