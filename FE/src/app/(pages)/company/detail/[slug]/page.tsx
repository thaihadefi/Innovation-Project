import Image from "next/image";
import { CardJobItem } from "@/app/components/card/CardJobItem";
import { FaLocationDot } from "react-icons/fa6";
import { notFound } from "next/navigation";
import { FollowButton } from "@/app/components/button/FollowButton";
import { ReviewSection } from "@/app/components/review/ReviewSection";
import { SanitizedHTML } from "@/app/components/common/SanitizedHTML";
import { cookies } from "next/headers";

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

  // Check follow status on server side
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  let initialFollowing = false;
  let isCompanyViewer = false;
  
  if (token) {
    try {
      // Check auth type first
      const authRes = await fetch(
        `${process.env.API_URL || "http://localhost:4001"}/auth/check`,
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
          `${process.env.NEXT_PUBLIC_API_URL}/candidate/follow/check/${companyDetail.id}`,
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
  const API_URL = process.env.API_URL || "http://localhost:4001";
  const reviewsRes = await fetch(`${API_URL}/review/company/${companyDetail.id}?page=1`, {
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
            
            {/* Reviews Section */}
            <ReviewSection 
              companyId={companyDetail.id} 
              companyName={companyDetail.companyName}
              initialReviews={initialReviews}
              initialStats={initialStats}
              initialPagination={initialPagination}
              isCompanyViewer={isCompanyViewer}
            />
            {/* End Reviews Section */}
          </div>
        </div>
      )}
      {/* End Company Detail */}
    </>
  );
}
