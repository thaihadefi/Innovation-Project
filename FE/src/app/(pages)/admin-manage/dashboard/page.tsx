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
  accent: string;
  icon: React.ReactNode;
};

const StatCard = ({ label, value, sub, accent, icon }: StatCardProps) => (
  <div className="bg-white rounded-[12px] p-[24px] border border-[#E8E8E8] hover:shadow-md transition-shadow duration-200">
    <div className="flex items-start justify-between gap-[12px] mb-[16px]">
      <p className="text-[12.5px] font-[600] text-[#6B7280] uppercase tracking-[0.5px]">{label}</p>
      <div className={`w-[36px] h-[36px] rounded-[10px] flex items-center justify-center shrink-0 ${accent}`}>
        {icon}
      </div>
    </div>
    <p className="text-[32px] font-[700] text-[#111827] leading-none mb-[8px]">{value.toLocaleString()}</p>
    {sub && <p className="text-[12px] text-[#9CA3AF] leading-relaxed">{sub}</p>}
  </div>
);

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const stats = await fetchStats(cookieStore.toString());

  return (
    <div className="py-[40px] px-[32px]">
      <div className="mb-[28px]">
        <h1 className="font-[700] text-[22px] text-[#111827]">Dashboard</h1>
        <p className="text-[14px] text-[#6B7280] mt-[4px]">Overview of platform activity</p>
      </div>

      {!stats ? (
        <div className="bg-white rounded-[12px] border border-[#E8E8E8] py-[60px] text-center">
          <div className="w-[48px] h-[48px] rounded-full bg-[#F3F4F6] flex items-center justify-center mx-auto mb-[12px]">
            <svg className="w-[22px] h-[22px] text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-[14px] text-[#6B7280]">Failed to load dashboard stats.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-[16px]">
          <StatCard
            label="Total Candidates"
            value={stats.candidates.total}
            sub={`Active: ${stats.candidates.active} · Inactive: ${stats.candidates.inactive}`}
            accent="bg-[#EEF6FF]"
            icon={
              <svg className="w-[18px] h-[18px] text-[#0088FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
          />
          <StatCard
            label="Unverified Candidates"
            value={stats.candidates.unverified}
            sub="Pending student ID verification"
            accent="bg-[#FFF7ED]"
            icon={
              <svg className="w-[18px] h-[18px] text-[#F97316]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            }
          />
          <StatCard
            label="Total Companies"
            value={stats.companies.total}
            sub={`Active: ${stats.companies.active} · Pending: ${stats.companies.pending}`}
            accent="bg-[#F0FDF4]"
            icon={
              <svg className="w-[18px] h-[18px] text-[#22C55E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            }
          />
          <StatCard
            label="Pending Approval"
            value={stats.companies.pending}
            sub="Companies awaiting approval"
            accent="bg-[#FFF1F2]"
            icon={
              <svg className="w-[18px] h-[18px] text-[#F43F5E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            label="Total Jobs"
            value={stats.jobs.total}
            accent="bg-[#F5F3FF]"
            icon={
              <svg className="w-[18px] h-[18px] text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            }
          />
          <StatCard
            label="Total Applications"
            value={stats.cvs.total}
            accent="bg-[#ECFEFF]"
            icon={
              <svg className="w-[18px] h-[18px] text-[#06B6D4]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
}
