"use client";
import Link from "next/link"
import Image from "next/image";
import { toast } from "sonner";
import { NotificationDropdown } from "@/app/components/notification/NotificationDropdown";
import { CompanyNotificationDropdown } from "@/app/components/notification/CompanyNotificationDropdown";

interface ServerAuth {
  infoCandidate: any;
  infoCompany: any;
  candidateUnreadCount?: number;
  companyUnreadCount?: number;
}

interface HeaderAccountProps {
  serverAuth: ServerAuth | null;
}

export const HeaderAccount = ({ serverAuth }: HeaderAccountProps) => {
  // Use ONLY server auth - no client-side fetch to prevent flash
  const infoCandidate = serverAuth?.infoCandidate;
  const infoCompany = serverAuth?.infoCompany;
  const isLogin = !!(infoCandidate || infoCompany);
  const avatarBlurDataURL =
    "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjMyIiBoZWlnaHQ9IjMyIiBmaWxsPSIjRjZGNkY2Ii8+PC9zdmc+";

  const handleLogout = (urlRedirect: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      credentials: "include" // Keep cookie
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "error") {
          toast.error(data.message);
        }

        if(data.code == "success") {
          // Hard refresh to clear server-side cached auth
          window.location.href = urlRedirect;
        }
      })
  }

  return (
    <>
      <div className="inline-flex items-center gap-x-[5px] font-[600] sm:text-[16px] text-[12px] text-white relative group/sub-1">
        {isLogin ? (<>
          {/* Logged in as candidate account */}
          {infoCandidate && (
            <div className="flex items-center gap-[20px]">
              {/* Notification - outside of avatar group */}
              <NotificationDropdown
                infoCandidate={infoCandidate}
                initialUnreadCount={serverAuth?.candidateUnreadCount}
              />
              
              {/* Avatar with dropdown - separate group */}
              <div className="relative group/avatar">
                <Link href="/candidate-manage/profile" className="flex items-center gap-[8px] cursor-pointer">
                  {infoCandidate.avatar ? (
                    <Image 
                      src={infoCandidate.avatar} 
                      alt={infoCandidate.fullName || "Avatar"}
                      width={32}
                      height={32}
                      className="w-[32px] h-[32px] rounded-full object-cover border-2 border-white bg-[#F6F6F6]"
                      placeholder="blur"
                      blurDataURL={avatarBlurDataURL}
                      priority
                      loading="eager"
                      unoptimized={infoCandidate.avatar?.includes("localhost")}
                    />
                  ) : (
                    <div className="w-[32px] h-[32px] rounded-full bg-[#FFB200] flex items-center justify-center text-[14px] font-bold text-white border-2 border-white">
                      {infoCandidate.fullName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline">{infoCandidate.fullName}</span>
                </Link>
                <ul className="absolute top-full right-0 pt-[8px] opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-200 z-50">
                  <div className="bg-[#000065] rounded-[8px] w-[200px] shadow-xl py-[4px]">
                    <li className="hover:bg-[#0000a0] transition-colors duration-200">
                      <Link href="/candidate-manage/profile" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                        Personal Information
                      </Link>
                    </li>
                    <li className="hover:bg-[#0000a0] transition-colors duration-200">
                      <Link href="/candidate-manage/cv/list" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                        Submitted Applications
                      </Link>
                    </li>
                    <li className="hover:bg-[#0000a0] transition-colors duration-200">
                      <Link href="/candidate-manage/followed-companies" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                        Followed Companies
                      </Link>
                    </li>
                    <li className="hover:bg-[#0000a0] transition-colors duration-200">
                      <Link href="/candidate-manage/saved-jobs" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                        Saved Jobs
                      </Link>
                    </li>
                    <li className="hover:bg-[#0000a0] transition-colors duration-200">
                      <Link href="/candidate-manage/recommendations" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                        Recommended Jobs
                      </Link>
                    </li>
                    <li className="hover:bg-[#0000a0] transition-colors duration-200">
                      <Link href="/candidate-manage/interview-tips" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                        Interview Tips
                      </Link>
                    </li>
                    <li 
                      className="py-[10px] px-[16px] hover:bg-[#0000a0] font-[500] text-[15px] text-white cursor-pointer transition-colors duration-200"
                      onClick={() => handleLogout("/candidate/login")}
                    >
                      Logout
                    </li>
                  </div>
                </ul>
              </div>
            </div>
          )}

          {/* Logged in as company account */}
          {infoCompany && (
            <div className="flex items-center gap-[20px]">
              <CompanyNotificationDropdown
                infoCompany={infoCompany}
                initialUnreadCount={serverAuth?.companyUnreadCount}
              />
              <div className="relative group/company">
              <Link href="/company-manage/profile" className="flex items-center gap-[8px] cursor-pointer">
                {infoCompany.logo ? (
                  <Image 
                    src={infoCompany.logo} 
                    alt={infoCompany.companyName || "Logo"}
                    width={32}
                    height={32}
                    className="w-[32px] h-[32px] rounded-full object-cover border-2 border-white bg-[#F6F6F6]"
                    placeholder="blur"
                    blurDataURL={avatarBlurDataURL}
                    priority
                    loading="eager"
                    unoptimized={infoCompany.logo?.includes("localhost")}
                  />
                ) : (
                  <div className="w-[32px] h-[32px] rounded-full bg-[#0088FF] flex items-center justify-center text-[14px] font-bold text-white border-2 border-white">
                    {infoCompany.companyName?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline">{infoCompany.companyName}</span>
              </Link>
              <ul className="absolute top-full right-0 pt-[8px] opacity-0 invisible group-hover/company:opacity-100 group-hover/company:visible transition-all duration-200 z-50">
                <div className="bg-[#000065] rounded-[8px] w-[200px] shadow-xl py-[4px]">
                  <li className="hover:bg-[#0000a0] transition-colors duration-200">
                    <Link href="/company-manage/profile" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                      Company Information
                    </Link>
                  </li>
                  <li className="hover:bg-[#0000a0] transition-colors duration-200">
                    <Link href="/company-manage/job/list" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                      Manage Jobs
                    </Link>
                  </li>
                  <li className="hover:bg-[#0000a0] transition-colors duration-200">
                    <Link href="/company-manage/cv/list" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                      Manage Applications
                    </Link>
                  </li>
                  <li className="hover:bg-[#0000a0] transition-colors duration-200">
                    <Link href="/company-manage/analytics" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                      Analytics
                    </Link>
                  </li>
                  <li 
                    className="py-[10px] px-[16px] hover:bg-[#0000a0] font-[500] text-[15px] text-white cursor-pointer transition-colors duration-200"
                    onClick={() => handleLogout("/company/login")}
                  >
                    Logout
                  </li>
                </div>
              </ul>
              </div>
            </div>
          )}
        </>) : (<>
          {/* Not logged in */}
          <Link href="/candidate/login" className="">
            Login
          </Link>
          <span className="">/</span>
          <Link href="/candidate/register" className="">
            Register
          </Link>
        </>)}
      </div>
    </>
  )
}
