import Link from "next/link";
import { FaLayerGroup, FaCode, FaListCheck, FaBookOpen, FaLaptopCode } from "react-icons/fa6";

export default function DsaPage() {
  return (
    <section className="rounded-[16px] border border-[#E5E7EB] bg-white p-[24px] shadow-sm">
      <div className="flex items-start gap-[12px]">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <FaLayerGroup />
        </div>
        <div>
          <h1 className="text-[28px] font-[700] text-[#111827]">Data Structures and Algorithms</h1>
          <p className="text-[14px] text-[#6B7280] mt-[6px]">
            Build your DSA prep library with reusable templates, stage checklists, and quick
            cheatsheets.
          </p>
        </div>
      </div>

      <div className="mt-[20px] grid gap-[16px] md:grid-cols-2">
        <Link
          href="/candidate-manage/interview-tips/dsa/code-templates"
          className="rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] p-[18px] transition-all duration-200 hover:bg-white hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-[10px] text-[#111827]">
            <FaCode className="text-[#111827]" />
            <span className="text-[16px] font-[700]">Code templates</span>
          </div>
          <p className="mt-[8px] text-[14px] text-[#6B7280]">
            Store patterns like two pointers, sliding window, BFS/DFS, and DP.
          </p>
        </Link>

        <Link
          href="/candidate-manage/interview-tips/dsa/stages-of-an-interview"
          className="rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] p-[18px] transition-all duration-200 hover:bg-white hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-[10px] text-[#111827]">
            <FaListCheck className="text-[#111827]" />
            <span className="text-[16px] font-[700]">Stages of an interview</span>
          </div>
          <p className="mt-[8px] text-[14px] text-[#6B7280]">
            Track the flow from introductions to final wrap-up.
          </p>
        </Link>

        <Link
          href="/candidate-manage/interview-tips/dsa/cheatsheets"
          className="rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] p-[18px] transition-all duration-200 hover:bg-white hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-[10px] text-[#111827]">
            <FaBookOpen className="text-[#111827]" />
            <span className="text-[16px] font-[700]">Cheatsheets</span>
          </div>
          <p className="mt-[8px] text-[14px] text-[#6B7280]">
            Keep Big-O tables, flowcharts, and summary cards.
          </p>
        </Link>

        <Link
          href="/candidate-manage/interview-tips/dsa/practice-resources"
          className="rounded-[14px] border border-[#E5E7EB] bg-[#F9FAFB] p-[18px] transition-all duration-200 hover:bg-white hover:shadow-md cursor-pointer"
        >
          <div className="flex items-center gap-[10px] text-[#111827]">
            <FaLaptopCode className="text-[#111827]" />
            <span className="text-[16px] font-[700]">Practice resources</span>
          </div>
          <p className="mt-[8px] text-[14px] text-[#6B7280]">
            External practice platforms and a recommended study approach.
          </p>
        </Link>
      </div>
    </section>
  );
}
