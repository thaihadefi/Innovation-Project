import Job from "../models/job.model";
import { positionList, salaryInsightsConfig } from "../config/variable";

export interface SalaryCategoryInsightDTO {
  category: string;
  slug?: string;
  type: "position" | "skill" | "location";
  jobCount: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

export interface OverallSalaryStatsDTO {
  totalJobs: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

export interface SalaryInsightsResultDTO {
  code: string;
  overall: OverallSalaryStatsDTO;
  byPosition: SalaryCategoryInsightDTO[];
  bySkill: SalaryCategoryInsightDTO[];
  byLocation: SalaryCategoryInsightDTO[];
}

interface PositionAggResult {
  _id: string;
  jobCount: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  minSalary: number;
  maxSalary: number;
}

interface SkillAggResult {
  _id: string;
  jobCount: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  minSalary: number;
  maxSalary: number;
}

interface LocationAggResult {
  _id: {
    id: string;
    name?: string;
    slug?: string;
  };
  jobCount: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  minSalary: number;
  maxSalary: number;
}

interface OverallAggResult {
  _id: null;
  totalJobs: number;
  avgSalaryMin: number;
  avgSalaryMax: number;
  minSalary: number;
  maxSalary: number;
}

export const fetchSalaryInsights = async (): Promise<SalaryInsightsResultDTO> => {
  const activeJobsFilter = {
    $or: [
      { expirationDate: { $exists: false } },
      { expirationDate: null },
      { expirationDate: { $gte: new Date() } }
    ]
  };

  const [positionStats, skillStats, locationStats, overallStats] = await Promise.all([
    Job.aggregate<PositionAggResult>([
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
      { $sort: { jobCount: -1, _id: 1 } }
    ]),
    Job.aggregate<SkillAggResult>([
      { $match: activeJobsFilter },
      { $unwind: "$skills" },
      {
        $group: {
          _id: "$skills",
          jobCount: { $sum: 1 },
          avgSalaryMin: { $avg: "$salaryMin" },
          avgSalaryMax: { $avg: "$salaryMax" },
          minSalary: { $min: "$salaryMin" },
          maxSalary: { $max: "$salaryMax" }
        }
      },
      { $sort: { jobCount: -1, _id: 1 } },
      { $limit: salaryInsightsConfig.topSkills }
    ]),
    Job.aggregate<LocationAggResult>([
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
      { $sort: { jobCount: -1, "_id.name": 1 } },
      { $limit: salaryInsightsConfig.topLocations }
    ]).collation({ locale: "vi", strength: 2 }),
    Job.aggregate<OverallAggResult>([
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
    ])
  ]);

  const positionInsights: SalaryCategoryInsightDTO[] = positionStats.map(stat => {
    const posLabel = positionList.find(p => p.value === stat._id)?.label || stat._id;
    return {
      category: posLabel,
      type: "position",
      jobCount: stat.jobCount,
      avgSalary: Math.round((stat.avgSalaryMin + stat.avgSalaryMax) / 2),
      minSalary: stat.minSalary,
      maxSalary: stat.maxSalary
    };
  });

  const skillInsights: SalaryCategoryInsightDTO[] = skillStats.map(stat => ({
    category: stat._id,
    type: "skill",
    jobCount: stat.jobCount,
    avgSalary: Math.round((stat.avgSalaryMin + stat.avgSalaryMax) / 2),
    minSalary: stat.minSalary,
    maxSalary: stat.maxSalary
  }));

  const locationInsights: SalaryCategoryInsightDTO[] = locationStats.map(stat => ({
    category: stat._id.name || "Unknown Location",
    slug: stat._id.slug || "",
    type: "location",
    jobCount: stat.jobCount,
    avgSalary: Math.round((stat.avgSalaryMin + stat.avgSalaryMax) / 2),
    minSalary: stat.minSalary,
    maxSalary: stat.maxSalary
  }));

  const overall = overallStats[0] || {
    _id: null,
    totalJobs: 0,
    avgSalaryMin: 0,
    avgSalaryMax: 0,
    minSalary: 0,
    maxSalary: 0
  };

  return {
    code: "success",
    overall: {
      totalJobs: overall.totalJobs,
      avgSalary: Math.round((overall.avgSalaryMin + overall.avgSalaryMax) / 2),
      minSalary: overall.minSalary,
      maxSalary: overall.maxSalary
    },
    byPosition: positionInsights,
    bySkill: skillInsights,
    byLocation: locationInsights
  };
};
