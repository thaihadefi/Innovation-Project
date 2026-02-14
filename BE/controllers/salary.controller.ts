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

    // Aggregate by technology (unwind technologySlugs array for consistent display)
    const technologyStats = await Job.aggregate([
      { $match: activeJobsFilter },
      { $unwind: "$technologySlugs" },
      {
        $group: {
          _id: "$technologySlugs",
          jobCount: { $sum: 1 },
          avgSalaryMin: { $avg: "$salaryMin" },
          avgSalaryMax: { $avg: "$salaryMax" },
          minSalary: { $min: "$salaryMin" },
          maxSalary: { $max: "$salaryMax" }
        }
      },
      { $sort: { jobCount: -1, _id: 1 } }, // Secondary sort by name when count equal
      { $limit: salaryInsightsConfig.topTechnologies }
    ]);

    const technologyInsights = technologyStats.map((stat: any) => ({
      category: stat._id,
      type: "technology",
      jobCount: stat.jobCount,
      avgSalary: Math.round((stat.avgSalaryMin + stat.avgSalaryMax) / 2),
      minSalary: stat.minSalary,
      maxSalary: stat.maxSalary
    }));

    // Aggregate by city (unwind cities array - stores city IDs as strings)
    // Convert string IDs to ObjectIds for lookup
    const cityStats = await Job.aggregate([
      { $match: activeJobsFilter },
      { $unwind: "$cities" },
      { 
        $addFields: { 
          cityObjectId: { $toObjectId: "$cities" } 
        } 
      },
      {
        $lookup: {
          from: "cities",
          localField: "cityObjectId",
          foreignField: "_id",
          as: "cityInfo"
        }
      },
      { $unwind: { path: "$cityInfo", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: { id: "$cities", name: "$cityInfo.name", slug: "$cityInfo.slug" },
          jobCount: { $sum: 1 },
          avgSalaryMin: { $avg: "$salaryMin" },
          avgSalaryMax: { $avg: "$salaryMax" },
          minSalary: { $min: "$salaryMin" },
          maxSalary: { $max: "$salaryMax" }
        }
      },
      { $sort: { jobCount: -1, "_id.name": 1 } }, // Secondary sort by name when count equal
      { $limit: salaryInsightsConfig.topCities }
    ]).collation({ locale: "vi", strength: 2 }); // Use Vietnamese collation for correct sorting

    const cityInsights = cityStats.map((stat: any) => ({
      category: stat._id.name || "Unknown City",
      slug: stat._id.slug || "",
      type: "city",
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
      byTechnology: technologyInsights,
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
