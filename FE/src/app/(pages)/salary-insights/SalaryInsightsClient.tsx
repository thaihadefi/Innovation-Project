/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from "recharts";
import { FaMoneyBillTrendUp, FaBriefcase, FaLocationDot, FaCode } from "react-icons/fa6";

interface SalaryInsight {
  category: string;
  slug?: string;
  type: string;
  jobCount: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

interface Overview {
  totalJobs: number;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
}

interface SalaryInsightsClientProps {
  overview: Overview;
  byPosition: SalaryInsight[];
  byTechnology: SalaryInsight[];
  byCity: SalaryInsight[];
}

const formatSalary = (value: number) => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(0)}M`;
  }
  return value.toLocaleString();
};

const CHART_COLORS = [
  "#0088FF", "#47BE02", "#FF5100", "#8B5CF6", "#FFB200",
  "#06B6D4", "#EC4899", "#84CC16", "#F59E0B", "#6366F1"
];

export function SalaryInsightsClient({ overview, byPosition, byTechnology, byCity }: SalaryInsightsClientProps) {
  return (
    <div className="py-[40px]">
      <div className="container">
        {/* Header */}
        <div className="text-center mb-[40px]">
          <h1 className="font-[700] text-[32px] text-[#121212] mb-[12px] flex items-center justify-center gap-[12px]">
            <FaMoneyBillTrendUp className="text-[#47BE02]" />
            Salary Insights
          </h1>
          <p className="text-[#666] text-[16px] max-w-[600px] mx-auto">
            Explore salary trends in the IT industry. Data aggregated from {overview?.totalJobs || 0} active job postings.
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid md:grid-cols-4 grid-cols-2 gap-[16px] mb-[40px]">
          <div className="bg-gradient-to-br from-[#0088FF] to-[#0066CC] rounded-[12px] p-[20px] text-white">
            <div className="text-[14px] opacity-80 mb-[8px]">Total Jobs</div>
            <div className="text-[28px] font-[700]">{overview?.totalJobs || 0}</div>
          </div>
          <div className="bg-gradient-to-br from-[#47BE02] to-[#3da002] rounded-[12px] p-[20px] text-white">
            <div className="text-[14px] opacity-80 mb-[8px]">Average Salary</div>
            <div className="text-[24px] font-[700]">{formatSalary(overview?.avgSalary || 0)} VND</div>
          </div>
          <div className="bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-[12px] p-[20px] text-white">
            <div className="text-[14px] opacity-80 mb-[8px]">Min Salary</div>
            <div className="text-[24px] font-[700]">{formatSalary(overview?.minSalary || 0)} VND</div>
          </div>
          <div className="bg-gradient-to-br from-[#FF5100] to-[#E64A00] rounded-[12px] p-[20px] text-white">
            <div className="text-[14px] opacity-80 mb-[8px]">Max Salary</div>
            <div className="text-[24px] font-[700]">{formatSalary(overview?.maxSalary || 0)} VND</div>
          </div>
        </div>

        {/* Salary by Position */}
        <div className="bg-white rounded-[12px] border border-[#DEDEDE] p-[24px] mb-[24px]">
          <h2 className="font-[600] text-[20px] text-[#121212] mb-[20px] flex items-center gap-[8px]">
            <FaBriefcase className="text-[#0088FF]" /> Salary by Position
          </h2>
          {byPosition.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byPosition} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatSalary} />
                <YAxis type="category" dataKey="category" width={80} tick={{ fontSize: 13 }} />
                <Tooltip 
                  formatter={(value: any) => [`${Number(value).toLocaleString()} VND`, "Avg Salary"]}
                  labelFormatter={(label) => `Position: ${label}`}
                />
                <Bar dataKey="avgSalary" name="Average Salary">
                  {byPosition.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-[40px] text-[#999]">No data available</div>
          )}
        </div>

        {/* Salary by Technology */}
        <div className="bg-white rounded-[12px] border border-[#DEDEDE] p-[24px] mb-[24px]">
          <h2 className="font-[600] text-[20px] text-[#121212] mb-[20px] flex items-center gap-[8px]">
            <FaCode className="text-[#8B5CF6]" /> Salary by Technology (Top 15)
          </h2>
          {byTechnology.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={byTechnology}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="category" 
                    tick={{ fontSize: 11 }} 
                    angle={-45} 
                    textAnchor="end" 
                    height={80}
                  />
                  <YAxis tickFormatter={formatSalary} />
                  <Tooltip 
                    formatter={(value: any) => [`${Number(value).toLocaleString()} VND`, "Avg Salary"]}
                    labelFormatter={(label) => `Technology: ${label}`}
                  />
                  <Bar dataKey="avgSalary" fill="#8B5CF6" name="Average Salary" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-[16px] flex flex-wrap gap-[8px]">
                {byTechnology.map((tech, i) => (
                  <Link 
                    href={`/search?language=${tech.category}`}
                    key={i}
                    className="bg-[#F6F6F6] rounded-[8px] px-[12px] py-[8px] text-[12px] hover:bg-[#E5E5E5] transition-colors cursor-pointer"
                  >
                    <span className="font-[600]">{tech.category}</span>
                    <span className="text-[#666] ml-[8px]">{tech.jobCount} jobs</span>
                    <span className="text-[#47BE02] ml-[8px]">{formatSalary(tech.avgSalary)} VND</span>
                  </Link>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-[40px] text-[#999]">No data available</div>
          )}
        </div>

        {/* Salary by City */}
        <div className="bg-white rounded-[12px] border border-[#DEDEDE] p-[24px]">
          <h2 className="font-[600] text-[20px] text-[#121212] mb-[20px] flex items-center gap-[8px]">
            <FaLocationDot className="text-[#FF5100]" /> Salary by City
          </h2>
          {byCity.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
              {byCity.map((city, i) => (
                <Link 
                  href={`/search?city=${city.slug || city.category}`}
                  key={i}
                  className="border border-[#DEDEDE] rounded-[8px] p-[16px] hover:shadow-md hover:border-[#0088FF] transition-all cursor-pointer block"
                >
                  <div className="flex items-center gap-[8px] mb-[8px]">
                    <FaLocationDot className="text-[#FF5100]" />
                    <span className="font-[600] text-[16px]">{city.category}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-[8px] text-[13px]">
                    <div>
                      <span className="text-[#666]">Jobs: </span>
                      <span className="font-[600]">{city.jobCount}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">Avg: </span>
                      <span className="font-[600] text-[#47BE02]">{formatSalary(city.avgSalary)}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">Min: </span>
                      <span className="font-[500]">{formatSalary(city.minSalary)}</span>
                    </div>
                    <div>
                      <span className="text-[#666]">Max: </span>
                      <span className="font-[500]">{formatSalary(city.maxSalary)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-[40px] text-[#999]">No data available</div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-center text-[12px] text-[#999] mt-[24px]">
          * Salary data is aggregated from active job postings. Actual salaries may vary based on experience, skills, and negotiation.
        </p>
      </div>
    </div>
  );
}
