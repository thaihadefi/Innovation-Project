import { useAuth } from "@/hooks/useAuth";
import Link from "next/link"
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { NotificationDropdown } from "@/app/components/notification/NotificationDropdown";
import { CompanyNotificationDropdown } from "@/app/components/notification/CompanyNotificationDropdown";

export const HeaderAccount = () => {
  const { isLogin, infoCandidate, infoCompany, authLoading } = useAuth();
  const router = useRouter();

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
          router.push(urlRedirect);
        }
      })
  }

  // Show nothing while checking auth to prevent flash
  if (authLoading) {
    return <div className="w-[100px] h-[40px]" />; // Placeholder to maintain layout
  }

  return (
    <>
      <div className="inline-flex items-center gap-x-[5px] font-[600] sm:text-[16px] text-[12px] text-white relative group/sub-1">
        {isLogin ? (<>
          {/* Logged in as candidate account */}
          {infoCandidate && (
            <div className="flex items-center gap-[20px]">
              {/* Notification - outside of avatar group */}
              <NotificationDropdown />
              
              {/* Avatar with dropdown - separate group */}
              <div className="relative group/avatar">
                <Link href="/candidate-manage/profile" className="flex items-center gap-[8px]">
                  {infoCandidate.avatar ? (
                    <Image 
                      src={infoCandidate.avatar} 
                      alt={infoCandidate.fullName || "Avatar"}
                      width={32}
                      height={32}
                      className="w-[32px] h-[32px] rounded-full object-cover border-2 border-white"
                      unoptimized={infoCandidate.avatar?.includes("localhost")}
                    />
                  ) : (
                    <div className="w-[32px] h-[32px] rounded-full bg-[#FFB200] flex items-center justify-center text-[14px] font-bold text-white border-2 border-white">
                      {infoCandidate.fullName?.charAt(0)?.toUpperCase()}
                    </div>
                  )}
                  <span className="hidden sm:inline">{infoCandidate.fullName}</span>
                </Link>
                <ul className="absolute top-full left-0 bg-[#000065] rounded-[4px] w-[200px] hidden group-hover/avatar:block z-[100]">
                  <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                    <Link href="/candidate-manage/profile" className="font-[600] text-[16px] text-white">
                      Personal Information
                    </Link>
                  </li>
                  <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                    <Link href="/candidate-manage/cv/list" className="font-[600] text-[16px] text-white">
                      Submitted Applications
                    </Link>
                  </li>
                  <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                    <Link href="/candidate-manage/followed-companies" className="font-[600] text-[16px] text-white">
                      Followed Companies
                    </Link>
                  </li>
                  <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                    <Link href="/candidate-manage/saved-jobs" className="font-[600] text-[16px] text-white">
                      Saved Jobs
                    </Link>
                  </li>
                  <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                    <Link href="/candidate-manage/recommendations" className="font-[600] text-[16px] text-white">
                      Recommended Jobs
                    </Link>
                  </li>
                  <li 
                    className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096] font-[600] text-[16px] text-white cursor-pointer"
                    onClick={() => handleLogout("/candidate/login")}
                  >
                    Logout
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Logged in as company account */}
          {infoCompany && (
            <div className="flex items-center gap-[20px]">
              <CompanyNotificationDropdown />
              <div className="relative group/company">
              <Link href="/company-manage/profile" className="flex items-center gap-[8px]">
                {infoCompany.logo ? (
                  <Image 
                    src={infoCompany.logo} 
                    alt={infoCompany.companyName || "Logo"}
                    width={32}
                    height={32}
                    className="w-[32px] h-[32px] rounded-full object-cover border-2 border-white"
                    unoptimized={infoCompany.logo?.includes("localhost")}
                  />
                ) : (
                  <div className="w-[32px] h-[32px] rounded-full bg-[#0088FF] flex items-center justify-center text-[14px] font-bold text-white border-2 border-white">
                    {infoCompany.companyName?.charAt(0)?.toUpperCase()}
                  </div>
                )}
                <span className="hidden sm:inline">{infoCompany.companyName}</span>
              </Link>
              <ul className="absolute top-full left-0 bg-[#000065] rounded-[4px] w-[200px] hidden group-hover/company:block z-[100]">
                <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                  <Link href="/company-manage/profile" className="font-[600] text-[16px] text-white">
                    Company Information
                  </Link>
                </li>
                <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                  <Link href="/company-manage/job/list" className="font-[600] text-[16px] text-white">
                    Manage Jobs
                  </Link>
                </li>
                <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                  <Link href="/company-manage/cv/list" className="font-[600] text-[16px] text-white">
                    Manage Applications
                  </Link>
                </li>
                <li className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                  <Link href="/company-manage/analytics" className="font-[600] text-[16px] text-white">
                    Analytics
                  </Link>
                </li>
                <li 
                  className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096] font-[600] text-[16px] text-white cursor-pointer"
                  onClick={() => handleLogout("/company/login")}
                >
                  Logout
                </li>
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