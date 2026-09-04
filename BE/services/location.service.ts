import Location from "../models/location.model";
import Job from "../models/job.model";
import cache, { CACHE_TTL } from "../helpers/cache.helper";
import { discoveryConfig } from "../config/variable";
import { ILocation } from "../interfaces/models/location.interface";
import { IJob } from "../interfaces/models/job.interface";

export interface TopLocationDTO {
  id: string;
  name: string;
  slug: string;
  jobCount: number;
}

export interface LocationItemDTO {
  _id: string;
  name: string;
  slug: string;
}

export const getTopLocations = async (): Promise<{ code: string; topLocations: TopLocationDTO[] }> => {
  const cacheKey = "top_locations";
  const cached = (await cache.getAsync(cacheKey)) as { code: string; topLocations: TopLocationDTO[] } | undefined;
  if (cached) {
    return cached;
  }

  const allJobs = await Job.find({
    $or: [
      { expirationDate: { $exists: false } },
      { expirationDate: null },
      { expirationDate: { $gte: new Date() } }
    ]
  })
    .select("locations")
    .lean<Pick<IJob, "_id" | "locations">[]>();

  const locationJobCount: Record<string, number> = {};
  allJobs.forEach(job => {
    if (Array.isArray(job.locations)) {
      job.locations.forEach(locId => {
        if (locId) {
          const key = locId.toString();
          locationJobCount[key] = (locationJobCount[key] || 0) + 1;
        }
      });
    }
  });

  const locationIds = Object.keys(locationJobCount);
  const locations = await Location.find({ _id: { $in: locationIds } })
    .select("name slug")
    .lean<ILocation[]>();

  const locationMap = new Map(locations.map(c => [c._id.toString(), c]));

  const topLocationsList: TopLocationDTO[] = locationIds
    .map(locationId => {
      const loc = locationMap.get(locationId);
      if (!loc) return null;
      return {
        id: loc._id.toString(),
        name: loc.name,
        slug: loc.slug,
        jobCount: locationJobCount[locationId] || 0
      };
    })
    .filter((loc): loc is TopLocationDTO => loc !== null);

  topLocationsList.sort((a, b) => b.jobCount - a.jobCount || (a.name || "").localeCompare(b.name || "", "vi"));

  const response = {
    code: "success",
    topLocations: topLocationsList.slice(0, discoveryConfig.topLocations)
  };

  cache.set(cacheKey, response, CACHE_TTL.STATIC);
  return response;
};

export const getLocationList = async (): Promise<{ code: string; message: string; locationList: LocationItemDTO[] }> => {
  const cacheKey = "location_list";
  const cached = (await cache.getAsync(cacheKey)) as { code: string; message: string; locationList: LocationItemDTO[] } | undefined;
  if (cached) {
    return cached;
  }

  const locationListRaw = await Location.find({})
    .select("name slug")
    .lean<ILocation[]>();

  const locationList: LocationItemDTO[] = locationListRaw.map(l => ({
    _id: l._id.toString(),
    name: l.name,
    slug: l.slug
  }));

  const response = {
    code: "success",
    message: "Success.",
    locationList
  };

  cache.set(cacheKey, response, CACHE_TTL.STATIC);
  return response;
};
