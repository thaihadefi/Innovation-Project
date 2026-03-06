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

const StatCard = ({ label, value, sub }: { label: string; value: number; sub?: string }) => (
  <div className="bg-white rounded-[12px] p-[24px] shadow-sm border border-[#E8E8E8]">
    <p className="text-[13px] text-[#666] font-[500] mb-[8px]">{label}</p>
    <p className="text-[32px] font-[700] text-[#121212]">{value.toLocaleString()}</p>
    {sub && <p className="text-[12px] text-[#999] mt-[4px]">{sub}</p>}
  </div>
);

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const stats = await fetchStats(cookieStore.toString());

  return (
    <div className="p-[32px]">
      <h1 className="font-[700] text-[24px] text-[#121212] mb-[24px]">Dashboard</h1>

      {!stats ? (
        <p className="text-[#666]">Failed to load stats.</p>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-[16px]">
          <StatCard label="Total Candidates" value={stats.candidates.total}
            sub={`Active: ${stats.candidates.active} · Inactive: ${stats.candidates.inactive}`} />
          <StatCard label="Unverified Candidates" value={stats.candidates.unverified}
            sub="Pending student ID verification" />
          <StatCard label="Total Companies" value={stats.companies.total}
            sub={`Active: ${stats.companies.active} · Pending: ${stats.companies.pending}`} />
          <StatCard label="Pending Approval" value={stats.companies.pending}
            sub="Companies awaiting approval" />
          <StatCard label="Total Jobs" value={stats.jobs.total} />
          <StatCard label="Total CVs" value={stats.cvs.total} />
        </div>
      )}
    </div>
  );
}
