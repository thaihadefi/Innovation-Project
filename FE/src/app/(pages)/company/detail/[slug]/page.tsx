/* eslint-disable @typescript-eslint/no-explicit-any */
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { FaLocationDot } from "react-icons/fa6";
import { notFound } from "next/navigation";

/* eslint-disable @next/next/no-img-element */
export default async function CompanyDetailPage(props: PageProps<'/company/detail/[slug]'>) {
  const { slug } = await props.params;
  
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/detail/${slug}`);
  const data = await res.json();

  let companyDetail: any = null;
  let jobList: any = null;

  if(data.code == "success") {
    companyDetail = data.companyDetail;
    jobList = data.jobList;
  } else {
    notFound();
  }

  return (
    <>
      {/* Company Detail */}
      {companyDetail && (
        <div className="pt-[30px] pb-[60px]">
          <div className="container">
            {/* Company Information */}
            <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
              <div className="flex flex-wrap items-center gap-[16px]">
                <div className="w-[100px] aspect-square rounded-[4px]">
                  <img
                    src={companyDetail.logo}
                    alt={companyDetail.companyName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="sm:flex-1">
                  <div className="font-[700] text-[28px] text-[#121212] mb-[10px]">
                    {companyDetail.companyName}
                  </div>
                  <div className="flex items-center gap-[8px] font-[400] text-[14px] text-[#121212]">
                    <FaLocationDot className="text-[16px]" /> {companyDetail.address}
                  </div>
                </div>
              </div>
              <div className="mt-[20px] flex flex-col gap-[10px]">
                <div className="flex items-center gap-[5px]">
                  <div className="font-[400] text-[16px] text-[#A6A6A6]">
                    Company Model:
                  </div>
                  <div className="font-[400] text-[16px] text-[#121212]">
                    {companyDetail.companyModel}
                  </div>
                </div>
                <div className="flex items-center gap-[5px]">
                  <div className="font-[400] text-[16px] text-[#A6A6A6]">
                    Company Size:
                  </div>
                  <div className="font-[400] text-[16px] text-[#121212]">
                    {companyDetail.companyEmployees}
                  </div>
                </div>
                <div className="flex items-center gap-[5px]">
                  <div className="font-[400] text-[16px] text-[#A6A6A6]">
                    Working Hours:
                  </div>
                  <div className="font-[400] text-[16px] text-[#121212]">
                    {companyDetail.workingTime}
                  </div>
                </div>
                <div className="flex items-center gap-[5px]">
                  <div className="font-[400] text-[16px] text-[#A6A6A6]">
                    Overtime Work:
                  </div>
                  <div className="font-[400] text-[16px] text-[#121212]">
                    {companyDetail.workOverTime}
                  </div>
                </div>
              </div>
            </div>
            {/* End Company Information */}
            {/* Detailed Description */}
            <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
              <div dangerouslySetInnerHTML={{ __html: companyDetail.description || "" }} />
            </div>
            {/* End Detailed Description */}
            {/* Jobs */}
            <div className="mt-[30px]">
              <h2 className="font-[700] text-[28px] text-[#121212] mb-[20px]">
                Company has {jobList.length} jobs
              </h2>
              {/* Wrap */}
              <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
                {jobList.map((item: any) => (
                  <CardJobItem key={item.id} item={item} />
                ))}
              </div>
            </div>
            {/* End Jobs */}
          </div>
        </div>
      )}
      {/* End Company Detail */}
    </>
  );
}
