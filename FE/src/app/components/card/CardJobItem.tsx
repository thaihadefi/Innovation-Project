/* eslint-disable @typescript-eslint/no-explicit-any */
import { memo } from "react";
import Image from "next/image";
import { positionList, workingFormList } from "@/configs/variable";
import { timeAgo } from "@/utils/time-ago";
import Link from "next/link";
import { FaBriefcase, FaLocationDot, FaUserTie, FaClock } from "react-icons/fa6";

const CardJobItemComponent = (props: {
  item: any
}) => {
  const { item } = props;

  const position = positionList.find(pos => pos.value == item.position);
  const workingForm = workingFormList.find(work => work.value == item.workingForm);

  // Calculate expiration status
  const getExpirationInfo = () => {
    if (!item.expirationDate) return null;
    const expDate = new Date(item.expirationDate);
    const now = new Date();
    const diffDays = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: "expired", label: "Expired" };
    if (diffDays === 0) return { status: "expiring", label: "Expires today" };
    if (diffDays <= 7) return { status: "expiring", label: `${diffDays} day${diffDays > 1 ? "s" : ""} left` };
    return null; // Don't show if > 7 days
  };

  const expirationInfo = getExpirationInfo();
  const isExpired = item.isExpired || expirationInfo?.status === "expired";

  return (
    <>
      <div 
        className={`rounded-[8px] border border-[#DEDEDE] relative ${isExpired ? "opacity-60" : ""}`}
        style={{
          background: "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)"
        }}
      >
        {/* Expired overlay badge */}
        {isExpired && (
          <div className="absolute top-[10px] right-[10px] z-10 bg-red-500 text-white text-[11px] font-[600] px-[10px] py-[3px] rounded-[4px]">
            Expired
          </div>
        )}
        {/* Expiring soon badge */}
        {!isExpired && expirationInfo?.status === "expiring" && (
          <div className="absolute top-[10px] right-[10px] z-10 bg-orange-500 text-white text-[11px] font-[600] px-[10px] py-[3px] rounded-[4px]">
            {expirationInfo.label}
          </div>
        )}
        <Link href={`/job/detail/${item.slug}`}>
          <Image 
            src="/assets/images/card-bg.svg" 
            alt="" 
            width={300}
            height={100}
            className="absolute top-0 left-0 w-full h-auto"
            priority={false}
          />
          <div className="relative">
            <div 
              className="w-[116px] aspect-square mt-[20px] mb-[20px] mx-auto rounded-[8px] bg-white overflow-hidden"
              style={{
                boxShadow: "0px 4px 24px 0px #0000001F"
              }}
            >
              {item.companyLogo ? (
                <Image 
                  src={item.companyLogo}
                  alt={item.companyName || "Company logo"}
                  width={116}
                  height={116}
                  className="w-full h-full object-contain p-[10px]"
                  unoptimized={item.companyLogo?.includes("localhost")}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#F6F6F6]">
                  <span className="text-[#999] text-[10px]">No logo</span>
                </div>
              )}
            </div>
            <h3 className="mx-[16px] mb-[6px] font-[700] sm:text-[18px] text-[14px] text-[#121212] text-center line-clamp-2">
              {item.title}
            </h3>
            {/* Application Stats */}
            <div className="flex justify-center gap-[6px] flex-wrap mb-[8px] px-[16px]">
              {item.isFull ? (
                <span className="bg-red-500 text-white text-[11px] font-[600] px-[10px] py-[3px] rounded-[4px]">
                  Positions Filled
                </span>
              ) : item.maxApproved > 0 ? (
                <span className="bg-green-500 text-white text-[11px] font-[600] px-[10px] py-[3px] rounded-[4px]">
                  {item.maxApproved - (item.approvedCount || 0)}/{item.maxApproved} slots
                </span>
              ) : null}
              {item.maxApplications > 0 && !item.isFull && (
                <span className="bg-blue-500 text-white text-[11px] font-[600] px-[10px] py-[3px] rounded-[4px]">
                  {item.applicationCount || 0}/{item.maxApplications} applied
                </span>
              )}
            </div>
            <div className="font-[400] text-[14px] mb-[12px] text-center text-[#121212]">
              {item.companyName}
            </div>
            <div className="font-[600] text-[16px] mb-[6px] text-center text-[#0088FF]">
              {item.salaryMin.toLocaleString("vi-VN")} VND - {item.salaryMax.toLocaleString("vi-VN")} VND
            </div>
            <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
              <FaUserTie className="text-[16px]" /> {position?.label}
            </div>
            <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
              <FaBriefcase className="text-[16px]" /> {workingForm?.label}
            </div>
            <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
              <FaLocationDot className="text-[16px]" /> 
              {item.jobCities && item.jobCities.length > 0 
                ? item.jobCities.slice(0, 5).join(", ") + (item.jobCities.length > 5 ? "..." : "")
                : (item.companyCity || "Remote")}
            </div>
            {item.createdAt && (
              <div className="flex items-center justify-center gap-[8px] font-[400] text-[12px] text-[#666] mb-[8px]">
                <FaClock className="text-[14px]" /> Posted {timeAgo(item.createdAt)}
              </div>
            )}
            <div className="flex flex-wrap items-center justify-center gap-[8px] mb-[20px]">
              {(item.technologySlugs || []).map((itemTech: string, indexTech: number) => (
                <div 
                  key={indexTech} 
                  className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]"
                >
                  {itemTech}
                </div>
              ))}
            </div>
          </div>
        </Link>
      </div>
    </>
  )
}

// Memoized export to prevent unnecessary re-renders
export const CardJobItem = memo(CardJobItemComponent);