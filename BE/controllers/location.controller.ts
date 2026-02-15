import { Request, Response } from "express";
import Location from "../models/location.model";
import AccountCompany from "../models/account-company.model";
import Job from "../models/job.model";
import cache, { CACHE_TTL } from "../helpers/cache.helper";
import { discoveryConfig } from "../config/variable";

export const topLocations = async (req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = "top_locations";
    const cached = cache.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get only active jobs (not expired)
    // Select only locations field
    const allJobs = await Job.find({
      $or: [
        { expirationDate: { $exists: false } },
        { expirationDate: null },
        { expirationDate: { $gte: new Date() } }
      ]
    }).select('locations').lean();

    // Count jobs by location using the job.locations array (job may list multiple location IDs)
    const locationJobCount: { [key: string]: number } = {};
    allJobs.forEach(job => {
      if (Array.isArray(job.locations)) {
        job.locations.forEach((locationId: any) => {
          if (locationId) {
            locationJobCount[locationId] = (locationJobCount[locationId] || 0) + 1;
          }
        });
      }
    });
    
    // Batch fetch all locations instead of N+1 queries
    const locationIds = Object.keys(locationJobCount);
    // Select only needed fields
    const locations = await Location.find({ _id: { $in: locationIds } })
      .select('name slug')
      .lean();
    const locationMap = new Map(locations.map((c: any) => [c._id.toString(), c]));
    
    // Build top locations array with O(1) lookup
    const topLocations = locationIds.map(locationId => {
      const location = locationMap.get(locationId);
      if (!location) return null;
      return {
        id: location._id?.toString(), // Use _id for lean() documents
        name: location.name,
        slug: location.slug,
        jobCount: locationJobCount[locationId]
      };
    }).filter(Boolean);
    
    // Sort by job count descending, then by name ascending when count equal
    topLocations.sort((a: any, b: any) => b.jobCount - a.jobCount || (a.name || "").localeCompare(b.name || "", "vi"));
    
    const response = {
      code: "success",
      topLocations: topLocations.slice(0, discoveryConfig.topLocations)
    };

    // Cache for 30 minutes (static data)
    cache.set(cacheKey, response, CACHE_TTL.STATIC);

    res.json(response);
  } catch (error) {
    res.json({
      code: "error",
      message: "Failed to fetch top locations"
    });
  }
}

export const list = async (req: Request, res: Response) => {
  // Select only needed fields, add cache
  const cacheKey = "location_list";
  const cached = cache.get(cacheKey);
  if (cached) {
    return res.json(cached);
  }

  const locationList = await Location.find({})
    .select('name slug')
    .lean();

  const response = {
    code: "success",
    message: "Success.",
    locationList: locationList
  };

  // Cache for 30 minutes (static data - locations rarely change)
  cache.set(cacheKey, response, CACHE_TTL.STATIC);

  res.json(response);
}
