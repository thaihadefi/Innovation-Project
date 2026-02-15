import { Response, Request } from "express";
import Job from "../models/job.model";
import { positionList, salaryInsightsConfig } from "../config/variable";

// Get salary insights aggregated from job data
export const getSalaryInsights = async (req: Request, res: Response) => {
  try {
    // Only consider active jobs (not expired)
    const activeJobsFilter = {
      $or: [
        { expirationDate: { $exists: false } },
        { expirationDate: null },
        { expirationDate: { $gte: new Date() } }
      ]
    };

    // Aggregate by position
    const positionStats = await Job.aggregate([
      { $match: activeJobsFilter },
      {
        $group: {
          _id: "$position",
          jobCount: { $sum: 1 },
          avgSalaryMin: { $avg: "$salaryMin" },
          avgSalaryMax: { $avg: "$salaryMax" },
          minSalary: { $min: "$salaryMin" },
          maxSalary: { $max: "$salaryMax" }
        }
      },
      { $sort: { jobCount: -1, _id: 1 } } // Secondary sort by name when count equal
    ]);

    // Map position values to labels
    const positionInsights = positionStats.map((stat: any) => {
      const posLabel = positionList.find((p: any) => p.value === stat._id)?.label || stat._id;
      return {
        category: posLabel,
        type: "position",
        jobCount: stat.jobCount,
        avgSalary: Math.round((stat.avgSalaryMin + stat.avgSalaryMax) / 2),
        minSalary: stat.minSalary,
        maxSalary: stat.maxSalary
      };
    });

    // Aggregate by skill (unwind skillSlugs array for consistent display)
    const skillStats = await Job.aggregate([
      { $match: activeJobsFilter },
      { $unwind: "$skillSlugs" },
      {
        $group: {
          _id: "$skillSlugs",
          jobCount: { $sum: 1 },
          avgSalaryMin: { $avg: "$salaryMin" },
          avgSalaryMax: { $avg: "$salaryMax" },
          minSalary: { $min: "$salaryMin" },
          maxSalary: { $max: "$salaryMax" }
        }
      },
      { $sort: { jobCount: -1, _id: 1 } }, // Secondary sort by name when count equal
      { $limit: salaryInsightsConfig.topSkills }
    ]);

    const skillInsights = skillStats.map((stat: any) => ({
      category: stat._id,
      type: "skill",
      jobCount: stat.jobCount,
      avgSalary: Math.round((stat.avgSalaryMin + stat.avgSalaryMax) / 2),
      minSalary: stat.minSalary,
      maxSalary: stat.maxSalary
    }));

    // Aggregate by location (unwind locations array - stores location IDs as strings)
    // Convert string IDs to ObjectIds for lookup
    const cityStats = await Job.aggregate([
      { $match: activeJobsFilter },
      { $unwind: "$locations" },
      { 
        $addFields: { 
          locationObjectId: { $toObjectId: "$locations" } 
        } 
      },
      {
        $lookup: {
          from: "locations",
          localField: "locationObjectId",
          foreignField: "_id",
          as: "locationInfo"
        }
      },
      { $unwind: { path: "$locationInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { id: "$locations", name: "$locationInfo.name", slug: "$locationInfo.slug" },
          jobCount: { $sum: 1 },
          avgSalaryMin: { $avg: "$salaryMin" },
          avgSalaryMax: { $avg: "$salaryMax" },
          minSalary: { $min: "$salaryMin" },
          maxSalary: { $max: "$salaryMax" }
        }
      },
      { $sort: { jobCount: -1, "_id.name": 1 } }, // Secondary sort by name when count equal
      { $limit: salaryInsightsConfig.topLocations }
    ]).collation({ locale: "vi", strength: 2 }); // Use Vietnamese collation for correct sorting

    const cityInsights = cityStats.map((stat: any) => ({
      category: stat._id.name || "Unknown Location",
      slug: stat._id.slug || "",
      type: "location",
      jobCount: stat.jobCount,
      avgSalary: Math.round((stat.avgSalaryMin + stat.avgSalaryMax) / 2),
      minSalary: stat.minSalary,
      maxSalary: stat.maxSalary
    }));

    // Overall market stats
    const overallStats = await Job.aggregate([
      { $match: activeJobsFilter },
      {
        $group: {
          _id: null,
          totalJobs: { $sum: 1 },
          avgSalaryMin: { $avg: "$salaryMin" },
          avgSalaryMax: { $avg: "$salaryMax" },
          minSalary: { $min: "$salaryMin" },
          maxSalary: { $max: "$salaryMax" }
        }
      }
    ]);

    const overall = overallStats[0] || {
      totalJobs: 0,
      avgSalaryMin: 0,
      avgSalaryMax: 0,
      minSalary: 0,
      maxSalary: 0
    };

    res.json({
      code: "success",
      overall: {
        totalJobs: overall.totalJobs,
        avgSalary: Math.round((overall.avgSalaryMin + overall.avgSalaryMax) / 2),
        minSalary: overall.minSalary,
        maxSalary: overall.maxSalary
      },
      byPosition: positionInsights,
      bySkill: skillInsights,
      byCity: cityInsights
    });
  } catch (error) {
    console.error("Salary insights error:", error);
    res.json({
      code: "error",
      message: "Failed to get salary insights"
    });
  }
};
