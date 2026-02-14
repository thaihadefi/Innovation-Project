import { memo } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaUserTie, FaStar } from "react-icons/fa6";
import { CompanyBadges } from "@/app/components/ui/CompanyBadges";

const CardCompanyItemComponent = (props: {
  item: any
}) => {
  const { item } = props;

  return (
    <>
      <div 
        className="rounded-[8px] border border-[#DEDEDE] relative cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
        style={{
          backgroundImage: "url('/assets/images/card-bg.svg'), linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)",
          backgroundRepeat: "no-repeat, no-repeat",
          backgroundSize: "100% auto, cover",
          backgroundPosition: "top left, center"
        }}
      >
        <Link href={`/company/detail/${item.slug}`}>
          <div className="relative">
            <div 
              className="w-[125px] sm:w-[160px] aspect-square mt-[20px] sm:mt-[32px] mb-[16px] sm:mb-[24px] mx-auto rounded-[8px] bg-white overflow-hidden relative"
              style={{
                boxShadow: "0px 4px 24px 0px #0000001F"
              }}
            >
              {item.logo ? (
                <Image 
                  src={item.logo}
                  alt={item.companyName || "Company logo"}
                  width={160}
                  height={160}
                  className="w-full h-full object-contain p-[10px]"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#F6F6F6]">
                  <span className="text-[#999] text-[12px]">No logo</span>
                </div>
              )}
            </div>
            <h3 className="mx-[8px] sm:mx-[16px] mb-[16px] sm:mb-[24px] font-[700] text-[14px] sm:text-[18px] text-[#121212] text-center line-clamp-2">
              {item.companyName}
            </h3>
            <div className="bg-[#F7F7F7] py-[12px] px-[16px]">
              {item.badges && item.badges.length > 0 && (
                <div className="mb-[8px] flex justify-center">
                  <CompanyBadges badges={item.badges} maxDisplay={4} />
                </div>
              )}
              <div className="flex flex-wrap items-center sm:justify-between justify-center gap-y-[8px] gap-x-[12px]">
                <div className="font-[400] text-[14px] text-[#414042]">
                  {item.cityName}
                </div>
                {item.avgRating && (
                  <div className="inline-flex items-center gap-[4px] font-[500] text-[14px] text-[#121212]">
                    <FaStar className="text-[#FFB800]" />
                    <span>{item.avgRating}</span>
                    <span className="text-[#666] font-[400]">({item.reviewCount})</span>
                  </div>
                )}
                <div className="inline-flex items-center gap-[6px] font-[400] text-[14px] text-[#121212]">
                  <FaUserTie className="text-[16px] text-[#000096]" /> {item.totalJob || item.jobCount || 0} Jobs
                </div>
              </div>
            </div>
          </div>
        </Link>
      </div>
    </>
  )
}

// Memoized export to prevent unnecessary re-renders
export const CardCompanyItem = memo(CardCompanyItemComponent);
