/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
import { memo } from "react";
import Link from "next/link";
import { FaUserTie } from "react-icons/fa6";

const CardCompanyItemComponent = (props: {
  item: any
}) => {
  const { item } = props;

  return (
    <>
      <div 
        className="rounded-[8px] border border-[#DEDEDE] relative"
        style={{
          background: "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)"
        }}
      >
        <Link href={`/company/detail/${item.slug}`}>
          <img 
            src="/assets/images/card-bg.svg" 
            alt="" 
            className="absolute top-0 left-0 w-full h-auto"
            loading="lazy"
          />
          <div className="relative">
            <div 
              className="sm:w-[160px] w-[125px] aspect-square sm:mt-[32px] mt-[20px] sm:mb-[24px] mb-[16px] mx-auto rounded-[8px] bg-white"
              style={{
                boxShadow: "0px 4px 24px 0px #0000001F"
              }}
            >
              <img 
                src={item.logo}
                alt="" 
                className="w-full h-full object-contain p-[10px]"
                loading="lazy"
              />
            </div>
            <h3 className="sm:mx-[16px] mx-[8px] sm:mb-[24px] mb-[16px] font-[700] sm:text-[18px] text-[14px] text-[#121212] text-center line-clamp-2">
              {item.companyName}
            </h3>
            <div className="bg-[#F7F7F7] py-[12px] px-[16px] flex flex-wrap items-center sm:justify-between justify-center gap-y-[12px]">
              <div className="font-[400] text-[14px] text-[#414042]">
                {item.cityName}
              </div>
              <div className="inline-flex items-center gap-[6px] font-[400] text-[14px] text-[#121212]">
                <FaUserTie className="text-[16px] text-[#000096]" /> {item.totalJob || item.jobCount || 0} Jobs
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