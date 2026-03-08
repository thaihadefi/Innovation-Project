import { Metadata } from "next";
import { faqData } from "./faq-data";

export const metadata: Metadata = {
  title: "FAQ - Frequently Asked Questions",
  description: "Find answers to common questions about UITJobs — for candidates, companies, and account management.",
};

/** Render answer text with email addresses converted to clickable mailto links */
function renderAnswer(text: string) {
  const parts = text.split(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g);
  return parts.map((part, i) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(part) ? (
      <a key={i} href={`mailto:${part}`} className="text-[#0088FF] hover:underline">
        {part}
      </a>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      {/* Hero */}
      <div className="bg-[#000065] py-[48px] px-[16px]">
        <div className="max-w-[800px] mx-auto text-center">
          <h1 className="font-[800] text-[32px] sm:text-[40px] text-white tracking-tight mb-[12px]">
            Frequently Asked Questions
          </h1>
          <p className="text-[16px] text-[#A6A6A6] max-w-[520px] mx-auto leading-relaxed">
            Everything you need to know about UITJobs. Can't find your answer?{" "}
            <a href="mailto:ctsv@uit.edu.vn" className="text-[#60B0FF] hover:underline">
              Contact us
            </a>
            .
          </p>
        </div>
      </div>

      {/* FAQ Content */}
      <div className="max-w-[800px] mx-auto px-[16px] py-[48px]">
        <div className="space-y-[40px]">
          {faqData.map((section) => (
            <div key={section.category}>
              {/* Category heading */}
              <h2 className="font-[700] text-[18px] text-[#0088FF] mb-[16px] flex items-center gap-[8px]">
                <span className="inline-block w-[4px] h-[20px] bg-[#0088FF] rounded-full" />
                {section.category}
              </h2>

              <div className="space-y-[8px]">
                {section.items.map((item) => (
                  <details
                    key={item.question}
                    className="group bg-white rounded-[12px] border border-[#E5E7EB] shadow-sm overflow-hidden"
                  >
                    <summary className="flex items-center justify-between gap-[16px] px-[20px] py-[16px] cursor-pointer select-none list-none hover:bg-[#F9FAFB] transition-colors duration-150">
                      <span className="font-[600] text-[15px] text-[#111827] leading-snug">
                        {item.question}
                      </span>
                      {/* Chevron */}
                      <svg
                        className="w-[18px] h-[18px] text-[#6B7280] shrink-0 transition-transform duration-200 group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="px-[20px] pb-[16px] pt-[4px]">
                      <p className="text-[14px] text-[#6B7280] leading-relaxed">{renderAnswer(item.answer)}</p>
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Still have questions */}
        <div className="mt-[48px] bg-white rounded-[16px] border border-[#E5E7EB] shadow-sm px-[32px] py-[32px] text-center">
          <h3 className="font-[700] text-[18px] text-[#111827] mb-[8px]">Still have questions?</h3>
          <p className="text-[14px] text-[#6B7280] mb-[20px]">
            Can't find what you're looking for, or found a bug? Reach out to us at{" "}
            <a href="mailto:ctsv@uit.edu.vn" className="text-[#0088FF] hover:underline">
              ctsv@uit.edu.vn
            </a>
            {" "}and we'll get back to you.
          </p>
          <a
            href="mailto:ctsv@uit.edu.vn"
            className="inline-block bg-[#0088FF] text-white font-[600] text-[14px] px-[24px] py-[10px] rounded-[8px] hover:bg-[#0077EE] transition-colors duration-200"
          >
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
