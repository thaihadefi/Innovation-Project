import Image from "next/image";
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { FaLocationDot } from "react-icons/fa6";
import { notFound } from "next/navigation";
import { FollowButton } from "@/app/components/button/FollowButton";
import { ReviewSection } from "@/app/components/review/ReviewSection";
import { SanitizedHTML } from "@/app/components/common/SanitizedHTML";
import { cookies } from "next/headers";
import CompanyJobsPagination from "./CompanyJobsPagination";
import { paginationConfig } from "@/configs/variable";

export default async function CompanyDetailPage(props: PageProps<'/company/detail/[slug]'> & {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { slug } = await props.params;
  const searchParams = await props.searchParams;
  const jobPage = Math.max(1, parseInt(String(searchParams.jobPage || "1"), 10) || 1);
  const reviewPage = Math.max(1, parseInt(String(searchParams.reviewPage || "1"), 10) || 1);
  const API_URL = process.env.API_URL || "http://localhost:4001";
  
  const jobLimit = paginationConfig.companyDetailJobs || 9;
  const companyDetailParams = new URLSearchParams();
  companyDetailParams.set("jobPage", String(jobPage));
  companyDetailParams.set("jobLimit", String(jobLimit));
  const res = await fetch(`${API_URL}/company/detail/${slug}?${companyDetailParams.toString()}`, {
    cache: "no-store"
  });
  const data = await res.json();

  let companyDetail: any = null;
  let jobList: any = null;
  let jobPagination: any = null;

  if(data.code == "success") {
    companyDetail = data.companyDetail;
    jobList = data.jobList;
    jobPagination = data.jobPagination || null;
  } else {
    notFound();
  }

  // Check follow status on server side
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let initialFollowing = false;
  let isCompanyViewer = false;
  
  if (token) {
    try {
      // Check auth type first
      const authRes = await fetch(
        `${API_URL}/auth/check`,
        { 
          headers: { Cookie: `token=${token}` },
          cache: "no-store"
        }
      );
      const authData = await authRes.json();
      if (authData.code === "success" && authData.infoCompany) {
        isCompanyViewer = true;
      } else if (authData.code === "success" && authData.infoCandidate) {
        // Only check follow for candidates
        const followRes = await fetch(
          `${API_URL}/candidate/follow/check/${companyDetail.id}`,
          { 
            headers: { Cookie: `token=${token}` },
            cache: "no-store"
          }
        );
        const followData = await followRes.json();
        if (followData.code === "success") {
          initialFollowing = followData.following;
        }
      }
    } catch {
      // Ignore error, user not logged in or network issue
    }
  }

  // Fetch initial reviews data on server
  const reviewParams = new URLSearchParams();
  reviewParams.set("page", String(reviewPage));
  const reviewsRes = await fetch(`${API_URL}/review/company/${companyDetail.id}?${reviewParams.toString()}`, {
    cache: "no-store"
  }).then(res => res.json()).catch(() => ({ code: "error" }));

  const initialReviews = reviewsRes.code === "success" ? reviewsRes.reviews || [] : [];
  const initialStats = reviewsRes.code === "success" ? reviewsRes.stats || null : null;
  const initialPagination = reviewsRes.code === "success" ? reviewsRes.pagination || null : null;

  return (
    <>
      {/* Company Detail */}
      {companyDetail && (
        <div className="pt-[30px] pb-[60px]">
          <div className="container">
            {/* Company Information */}
            <div className="border border-[#DEDEDE] rounded-[8px] p-[20px]">
              <div className="flex flex-wrap items-center gap-[16px]">
                <div className="w-[100px] aspect-square rounded-[4px] bg-[#F6F6F6] overflow-hidden">
                  {companyDetail.logo ? (
                    <Image
                      src={companyDetail.logo}
                      alt={companyDetail.companyName || "Logo"}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                      priority
                      unoptimized={companyDetail.logo?.includes("localhost")}
                    />
                  ) : (
                    <div className="w-full h-full bg-[#F6F6F6] flex items-center justify-center">
                      <span className="text-[#999]">No logo</span>
                    </div>
                  )}
                </div>
                <div className="sm:flex-1">
                  <div className="font-[700] text-[28px] text-[#121212] mb-[10px]">
                    {companyDetail.companyName}
                  </div>
                  <div className="flex items-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[12px]">
                    <FaLocationDot className="text-[16px]" /> {companyDetail.address}
                  </div>
                  <FollowButton companyId={companyDetail.id} initialFollowing={initialFollowing} isCompanyViewer={isCompanyViewer} />
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
                <div className="flex items-center gap-[5px]">
                  <div className="font-[400] text-[16px] text-[#A6A6A6]">
                    Followers:
                  </div>
                  <div className="font-[600] text-[16px] text-[#0088FF]">
                    {companyDetail.followerCount || 0}
                  </div>
                </div>
              </div>
            </div>
            {/* End Company Information */}
            {/* Detailed Description */}
            <div className="border border-[#DEDEDE] rounded-[8px] p-[20px] mt-[20px]">
              <SanitizedHTML html={companyDetail.description || ""} />
            </div>
            {/* End Detailed Description */}
            {/* Jobs */}
            <div id="company-jobs" className="mt-[30px]">
              <h2 className="font-[700] text-[28px] text-[#121212] mb-[20px]">
                Company has {jobPagination?.totalRecord ?? jobList.length} jobs
              </h2>
              {/* Wrap */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-[20px]">
                {jobList.map((item: any) => (
                  <CardJobItem key={item.id} item={item} />
                ))}
              </div>
              {jobPagination && jobPagination.totalPage > 1 && (
                <CompanyJobsPagination
                  currentPage={jobPagination.currentPage}
                  totalPage={jobPagination.totalPage}
                  totalRecord={jobPagination.totalRecord}
                  pageSize={jobPagination.pageSize}
                  currentCount={jobList.length}
                />
              )}
            </div>
            {/* End Jobs */}
            
            {/* Reviews Section */}
            <div id="company-reviews">
              <ReviewSection 
                companyId={companyDetail.id} 
                companyName={companyDetail.companyName}
                initialReviews={initialReviews}
                initialStats={initialStats}
                initialPagination={initialPagination}
                isCompanyViewer={isCompanyViewer}
              />
            </div>
            {/* End Reviews Section */}
          </div>
        </div>
      )}
      {/* End Company Detail */}
    </>
  );
}
