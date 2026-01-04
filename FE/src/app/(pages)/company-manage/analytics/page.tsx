/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { 
  FaEye, 
  FaFileAlt, 
  FaCheckCircle, 
  FaChartLine,
  FaChartBar,
  FaArrowUp,
  FaArrowDown
} from "react-icons/fa";
import Link from "next/link";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";

interface OverviewStats {
  totalJobs: number;
  totalViews: number;
  totalApplications: number;
  totalApproved: number;
  applyRate: number;
  approvalRate: number;
}

interface JobStats {
  id: string;
  title: string;
  slug: string;
  views: number;
  applications: number;
  approved: number;
  applyRate: number;
  approvalRate: number;
  createdAt: string;
  isExpired: boolean;
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<OverviewStats | null>(null);
  const [jobs, setJobs] = useState<JobStats[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/analytics`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setOverview(data.overview);
          setJobs(data.jobs);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  if (loading) {
    return (
      <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
        <div className="container">
          <div className="text-center py-[60px] text-[#666]">Loading analytics...</div>
        </div>
      </div>
    );
  }

  // Prepare chart data (top 10 jobs)
  const chartData = jobs.slice(0, 10).map(job => ({
    name: job.title.length > 20 ? job.title.substring(0, 17) + "..." : job.title,
    views: job.views,
    applications: job.applications,
    approved: job.approved
  }));

  // Pie chart data for application status (colors match cvStatusList)
  const pieData = [
    { name: "Approved", value: (overview as any)?.totalApproved || 0, color: "#47BE02" },
    { name: "Viewed", value: (overview as any)?.totalViewed || 0, color: "#0088FF" },
    { name: "Rejected", value: (overview as any)?.totalRejected || 0, color: "#FF5100" },
    { name: "Pending", value: (overview as any)?.totalPending || 0, color: "#121212" }
  ].filter(item => item.value > 0); // Only show statuses that have values

  return (
    <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
      <div className="container">
        {/* Header */}
        <div className="flex items-center justify-between mb-[30px]">
          <div>
            <h1 className="font-[700] text-[24px] text-[#121212] flex items-center gap-[12px]">
              <FaChartBar className="text-[#0088FF]" />
              Analytics Dashboard
            </h1>
            <p className="text-[#666] text-[14px] mt-[4px]">
              Track your job posting performance
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid lg:grid-cols-4 md:grid-cols-2 grid-cols-1 gap-[20px] mb-[30px]">
          {/* Total Views */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-[12px] p-[24px] text-white shadow-lg">
            <div className="flex items-center justify-between mb-[12px]">
              <FaEye className="text-[28px] opacity-80" />
              <span className="text-[12px] opacity-75">Total Views</span>
            </div>
            <div className="text-[32px] font-[700]">
              {overview?.totalViews.toLocaleString() || 0}
            </div>
          </div>

          {/* Total Applications */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-[12px] p-[24px] text-white shadow-lg">
            <div className="flex items-center justify-between mb-[12px]">
              <FaFileAlt className="text-[28px] opacity-80" />
              <span className="text-[12px] opacity-75">Applications</span>
            </div>
            <div className="text-[32px] font-[700]">
              {overview?.totalApplications.toLocaleString() || 0}
            </div>
          </div>

          {/* Total Approved */}
          <div className="bg-gradient-to-br from-[#47BE02] to-[#3da002] rounded-[12px] p-[24px] text-white shadow-lg">
            <div className="flex items-center justify-between mb-[12px]">
              <FaCheckCircle className="text-[28px] opacity-80" />
              <span className="text-[12px] opacity-75">Approved</span>
            </div>
            <div className="text-[32px] font-[700]">
              {overview?.totalApproved.toLocaleString() || 0}
            </div>
          </div>

          {/* Conversion Rates */}
          <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-[12px] p-[24px] text-white shadow-lg">
            <div className="flex items-center justify-between mb-[12px]">
              <FaChartLine className="text-[28px] opacity-80" />
              <span className="text-[12px] opacity-75">Rates</span>
            </div>
            <div className="flex gap-[16px]">
              <div>
                <div className="text-[20px] font-[700]">{overview?.applyRate || 0}%</div>
                <div className="text-[10px] opacity-75">Apply Rate</div>
              </div>
              <div>
                <div className="text-[20px] font-[700]">{overview?.approvalRate || 0}%</div>
                <div className="text-[10px] opacity-75">Approval</div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 grid-cols-1 gap-[20px] mb-[30px]">
          {/* Bar Chart */}
          <div className="lg:col-span-2 bg-white rounded-[12px] p-[24px] border border-[#E5E5E5] shadow-sm">
            <h2 className="font-[600] text-[18px] text-[#121212] mb-[20px]">
              Job Performance (Top 10)
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 11 }} 
                    angle={-45} 
                    textAnchor="end" 
                    height={70}
                  />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="#3B82F6" name="Views" />
                  <Bar dataKey="applications" fill="#8B5CF6" name="Applications" />
                  <Bar dataKey="approved" fill="#47BE02" name="Approved" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-[60px] text-[#999]">
                No data to display. Post some jobs to see analytics.
              </div>
            )}
          </div>

          {/* Pie Chart */}
          <div className="bg-white rounded-[12px] p-[24px] border border-[#E5E5E5] shadow-sm">
            <h2 className="font-[600] text-[18px] text-[#121212] mb-[20px]">
              Application Status
            </h2>
            {(overview?.totalApplications || 0) > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                    label
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-[60px] text-[#999]">
                No applications yet
              </div>
            )}
          </div>
        </div>

        {/* Jobs Table */}
        <div className="bg-white rounded-[12px] p-[24px] border border-[#E5E5E5] shadow-sm">
          <h2 className="font-[600] text-[18px] text-[#121212] mb-[20px]">
            All Jobs Performance
          </h2>
          {jobs.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E5E5]">
                    <th className="text-left py-[12px] px-[16px] text-[13px] font-[600] text-[#666]">Job Title</th>
                    <th className="text-center py-[12px] px-[16px] text-[13px] font-[600] text-[#666]">Views</th>
                    <th className="text-center py-[12px] px-[16px] text-[13px] font-[600] text-[#666]">Applications</th>
                    <th className="text-center py-[12px] px-[16px] text-[13px] font-[600] text-[#666]">Approved</th>
                    <th className="text-center py-[12px] px-[16px] text-[13px] font-[600] text-[#666]">Apply Rate</th>
                    <th className="text-center py-[12px] px-[16px] text-[13px] font-[600] text-[#666]">Approval Rate</th>
                    <th className="text-center py-[12px] px-[16px] text-[13px] font-[600] text-[#666]">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b border-[#F0F0F0] hover:bg-[#F9F9F9]">
                      <td className="py-[14px] px-[16px]">
                        <Link 
                          href={`/job/detail/${job.slug}`}
                          className="text-[14px] font-[500] text-[#121212] hover:text-[#0088FF]"
                        >
                          {job.title}
                        </Link>
                      </td>
                      <td className="text-center py-[14px] px-[16px]">
                        <span className="text-[#3B82F6] font-[600]">
                          {job.views.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center py-[14px] px-[16px]">
                        <span className="text-[#8B5CF6] font-[600]">
                          {job.applications.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center py-[14px] px-[16px]">
                        <span className="text-[#22C55E] font-[600]">
                          {job.approved.toLocaleString()}
                        </span>
                      </td>
                      <td className="text-center py-[14px] px-[16px]">
                        <span className={`flex items-center justify-center gap-[4px] text-[14px] ${
                          job.applyRate > 5 ? "text-green-600" : job.applyRate > 2 ? "text-orange-500" : "text-red-500"
                        }`}>
                          {job.applyRate > 5 ? <FaArrowUp /> : <FaArrowDown />}
                          {job.applyRate}%
                        </span>
                      </td>
                      <td className="text-center py-[14px] px-[16px]">
                        <span className={`flex items-center justify-center gap-[4px] text-[14px] ${
                          job.approvalRate > 20 ? "text-green-600" : job.approvalRate > 10 ? "text-orange-500" : "text-gray-500"
                        }`}>
                          {job.approvalRate > 20 ? <FaArrowUp /> : job.approvalRate > 0 ? <FaArrowDown /> : null}
                          {job.approvalRate}%
                        </span>
                      </td>
                      <td className="text-center py-[14px] px-[16px]">
                        {job.isExpired ? (
                          <span className="bg-gray-100 text-gray-600 text-[11px] px-[8px] py-[3px] rounded-full">
                            Expired
                          </span>
                        ) : (
                          <span className="bg-green-100 text-green-600 text-[11px] px-[8px] py-[3px] rounded-full">
                            Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-[40px] text-[#999]">
              <p className="mb-[16px]">No jobs posted yet</p>
              <Link 
                href="/company-manage/job/create"
                className="inline-block bg-[#0088FF] text-white px-[20px] py-[10px] rounded-[8px] font-[600] hover:bg-[#0070d6] transition-colors duration-200"
              >
                Create Your First Job
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
