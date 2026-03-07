import { Metadata } from "next";
import { cookies } from "next/headers";

export const metadata: Metadata = { title: "Admin Dashboard" };

async function fetchStats(cookieString: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/dashboard`, {
      headers: { Cookie: cookieString },
      credentials: "include",
      cache: "no-store",
    });
    const data = await res.json();
    return data.code === "success" ? data.stats : null;
  } catch {
    return null;
  }
}

type StatCardProps = {
  label: string;
  value: number;
  sub?: string;
  gradient: string;
  iconBg: string;
  icon: React.ReactNode;
};

const StatCard = ({ label, value, sub, gradient, iconBg, icon }: StatCardProps) => (
  <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
    {/* Gradient top accent bar */}
    <div className={`h-[3px] w-full ${gradient}`} />
    <div className="p-[24px]">
      <div className="flex items-start justify-between gap-[12px] mb-[16px]">
        <p className="text-[11.5px] font-[600] text-[#6B7280] uppercase tracking-[0.8px] leading-tight">{label}</p>
        <div className={`w-[40px] h-[40px] rounded-[12px] flex items-center justify-center shrink-0 ${iconBg}`}>
          {icon}
        </div>
      </div>
      <p className="text-[34px] font-[800] text-[#111827] leading-none mb-[8px] tracking-tight">
        {value.toLocaleString()}
      </p>
      {sub && <p className="text-[12px] text-[#9CA3AF] leading-relaxed">{sub}</p>}
    </div>
  </div>
);

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const stats = await fetchStats(cookieStore.toString());

  return (
    <div className="py-[40px] px-[32px]">
      <div className="mb-[32px]">
        <h1 className="font-[800] text-[24px] text-[#111827] tracking-tight">Dashboard</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Overview of platform activity</p>
      </div>

      {!stats ? (
        <div className="bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm py-[80px] text-center">
          <div className="w-[52px] h-[52px] rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-[14px]">
            <svg className="w-[24px] h-[24px] text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[15px] font-[600] text-[#374151] mb-[4px]">Unable to load stats</p>
          <p className="text-[13px] text-[#9CA3AF]">Failed to fetch dashboard data. Please try again.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-[20px]">
          <StatCard
            label="Total Candidates"
            value={stats.candidates.total}
            sub={`Active: ${stats.candidates.active} · Inactive: ${stats.candidates.inactive}`}
            gradient="bg-gradient-to-r from-[#0088FF] to-[#60B0FF]"
            iconBg="bg-[#EEF6FF]"
            icon={
              <svg className="w-[20px] h-[20px] text-[#0088FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="Unverified Candidates"
            value={stats.candidates.unverified}
            sub="Pending student ID verification"
            gradient="bg-gradient-to-r from-[#F97316] to-[#FBBF24]"
            iconBg="bg-[#FFF7ED]"
            icon={
              <svg className="w-[20px] h-[20px] text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          <StatCard
            label="Total Companies"
            value={stats.companies.total}
            sub={`Active: ${stats.companies.active} · Pending: ${stats.companies.pending}`}
            gradient="bg-gradient-to-r from-[#22C55E] to-[#6EE7B7]"
            iconBg="bg-[#F0FDF4]"
            icon={
              <svg className="w-[20px] h-[20px] text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            label="Pending Approval"
            value={stats.companies.pending}
            sub="Companies awaiting approval"
            gradient="bg-gradient-to-r from-[#F43F5E] to-[#FB7185]"
            iconBg="bg-[#FFF1F2]"
            icon={
              <svg className="w-[20px] h-[20px] text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Jobs"
            value={stats.jobs.total}
            gradient="bg-gradient-to-r from-[#8B5CF6] to-[#C4B5FD]"
            iconBg="bg-[#F5F3FF]"
            icon={
              <svg className="w-[20px] h-[20px] text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Total Applications"
            value={stats.cvs.total}
            gradient="bg-gradient-to-r from-[#06B6D4] to-[#67E8F9]"
            iconBg="bg-[#ECFEFF]"
            icon={
              <svg className="w-[20px] h-[20px] text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
}
