import Link from "next/link";
import { FaLaptopCode } from "react-icons/fa6";

export default function PracticeResourcesPage() {
  return (
    <section className="article-content rounded-[16px] border border-[#E5E7EB] bg-white p-[16px] sm:p-[24px] shadow-sm">
      <div className="flex items-start gap-[12px]">
        <div className="flex h-[44px] w-[44px] items-center justify-center rounded-[12px] bg-[#0EA5E9]/10 text-[#0EA5E9]">
          <FaLaptopCode />
        </div>
        <div className="flex-1">
          <h1 className="text-[26px] font-[700] text-[#111827]">Practice resources</h1>
          <p className="mt-[6px] text-[14px] text-[#6B7280]">
            Suggested platforms and a practical study flow for improving DSA interview performance.
          </p>
        </div>
      </div>

      <div className="mt-[16px] space-y-[18px]">
        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">LeetCode</h3>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            <Link
              href="https://leetcode.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-200"
            >
              https://leetcode.com
            </Link>
          </p>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            Our recommendation: focus on one topic at a time. Once you gain a good understanding
            and comfort with a given topic, you won&apos;t lose it for a long time.
          </p>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            Solve 5 to 10 of the problems for each topic, or as many as you want until you feel
            comfortable. A good start would be the bonus problems at the end of each chapter.
          </p>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            If you are ever stuck on a problem, don&apos;t just stare at it for an hour. Read the
            official solution if available, or go to the discuss section and look at the solution
            there. Make sure you 100% understand the algorithm, then move on to the next problem,
            and come back to the problem you were stuck on in a few days or a week.
          </p>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            Other than solving problems, LeetCode also has several other features. There are
            simulated{" "}
            <Link
              href="https://leetcode.com/assessment/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-200"
            >
              interviews by company
            </Link>
            ,{" "}
            <Link
              href="https://leetcode.com/study-plan/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-200"
            >
              study plans
            </Link>
            ,{" "}
            <Link
              href="https://leetcode.com/contest/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-200"
            >
              weekly contests
            </Link>
            , and more. The contests are a great way to practice for interviews. Every contest has
            4 new questions, usually an easy, two mediums, and a hard, with only 90 minutes to
            finish, simulating a high-pressure timed environment. You can also do virtual contests
            for any of the past contests.
          </p>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">CSES Problem Set</h3>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            <Link
              href="https://cses.fi/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-200"
            >
              https://cses.fi/
            </Link>
          </p>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            CSES is a focused, clean problem set that works very well for drilling fundamentals.
            It is strong for practicing implementation discipline and classic topics like sorting,
            searching, graph traversal, and dynamic programming without too much platform noise.
          </p>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">USACO Guide</h3>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            <Link
              href="https://usaco.guide/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8] transition-colors duration-200"
            >
              https://usaco.guide/
            </Link>
          </p>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            USACO Guide is a structured learning path with explanations, curated exercises, and
            progressive difficulty. It is especially useful when you want a step-by-step track
            instead of random problem picking, and it helps close theoretical gaps before interview
            practice.
          </p>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">MOOC.fi</h3>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            <Link
              href="https://www.mooc.fi/en/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8]"
            >
              https://www.mooc.fi/en/
            </Link>
          </p>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            MOOC.fi provides free, university-level programming courses with structured lessons and
            hands-on exercises. It is a good fit when you want to strengthen core CS foundations
            through guided coursework before scaling up interview-style problem solving.
          </p>
        </div>

        <hr className="border-[#E5E7EB]" />

        <div>
          <h3 className="text-[18px] font-[700] text-[#111827]">
            Math, statistics, and programming resources
          </h3>
          <p className="mt-[8px] text-[14px] text-[#374151]">
            <Link
              href="https://intercom.help/wqu/en/articles/7960358-math-statistics-and-programming-resources"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#2563EB] hover:text-[#1D4ED8]"
            >
              https://intercom.help/wqu/en/articles/7960358-math-statistics-and-programming-resources
            </Link>
          </p>
          <p className="mt-[10px] text-[14px] text-[#374151]">
            A curated reference list that helps strengthen prerequisite math and statistics skills
            alongside practical programming fundamentals. Use it when you want to close theory gaps
            that block progress on interview problem solving.
          </p>
        </div>

        <hr className="border-[#E5E7EB]" />
      </div>
    </section>
  );
}
