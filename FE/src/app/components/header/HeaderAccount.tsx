"use client";
import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link"
import Image from "next/image";
import { toast } from "sonner";
import { NotificationDropdown } from "@/app/components/notification/NotificationDropdown";
import { CompanyNotificationDropdown } from "@/app/components/notification/CompanyNotificationDropdown";
import { useAuthContext } from "@/contexts/AuthContext";

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
  const { isLogin: clientIsLogin, infoCandidate: clientCandidate, infoCompany: clientCompany } = useAuthContext();
  const pathname = usePathname();
  
  // Use client state if available (it syncs from serverAuth initially but updates on refreshAuth)
  // Fallback to serverAuth during initial render to prevent flash
  const isLogin = clientIsLogin !== undefined ? clientIsLogin : !!(serverAuth?.infoCandidate || serverAuth?.infoCompany);
  const infoCandidate = clientCandidate || serverAuth?.infoCandidate;
  const infoCompany = clientCompany || serverAuth?.infoCompany;

  const handleLogout = (urlRedirect: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: "POST",
      cache: "no-store",
      credentials: "include" // Keep cookie
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "error") {
          toast.error(data.message);
        }

        if(data.code == "success") {
          // Clear client-side auth cache before redirect
          sessionStorage.removeItem("auth_data");
          sessionStorage.removeItem("auth_time");
          // Hard refresh to clear server-side cached auth
          window.location.href = urlRedirect;
        }
      })
  }

  // Click-based dropdown state for mobile support
  const [candidateDropdownOpen, setCandidateDropdownOpen] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);
  const candidateRef = useRef<HTMLDivElement>(null);
  const companyRef = useRef<HTMLDivElement>(null);
  
  // Track pointer type to prevent touch devices from triggering hover
  const isPointerMouse = useRef(true);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (candidateRef.current && !candidateRef.current.contains(event.target as Node)) {
        setCandidateDropdownOpen(false);
      }
      if (companyRef.current && !companyRef.current.contains(event.target as Node)) {
        setCompanyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Hybrid event handlers for candidate dropdown
  const handleCandidatePointerEnter = (e: React.PointerEvent) => {
    isPointerMouse.current = e.pointerType === 'mouse';
    if (isPointerMouse.current) setCandidateDropdownOpen(true);
  };
  const handleCandidatePointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setCandidateDropdownOpen(false);
  };
  const handleCandidateClick = () => {
    setCandidateDropdownOpen(!candidateDropdownOpen);
  };

  // Hybrid event handlers for company dropdown
  const handleCompanyPointerEnter = (e: React.PointerEvent) => {
    isPointerMouse.current = e.pointerType === 'mouse';
    if (isPointerMouse.current) setCompanyDropdownOpen(true);
  };
  const handleCompanyPointerLeave = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') setCompanyDropdownOpen(false);
  };
  const handleCompanyClick = () => {
    setCompanyDropdownOpen(!companyDropdownOpen);
  };

  return (
    <>
      <div className="inline-flex items-center gap-x-[5px] font-[600] text-[12px] sm:text-[16px] text-white relative group/sub-1">
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
              <div 
                className="relative" 
                ref={candidateRef}
                onPointerEnter={handleCandidatePointerEnter}
                onPointerLeave={handleCandidatePointerLeave}
              >
                <div 
                  onClick={handleCandidateClick}
                  className="flex items-center gap-[8px] cursor-pointer"
                >
                  {infoCandidate.avatar ? (
                    <Image 
                      src={infoCandidate.avatar} 
                      alt={infoCandidate.fullName || "Avatar"}
                      width={32}
                      height={32}
                      className="w-[32px] h-[32px] rounded-full object-cover border-2 border-white bg-[#F6F6F6]"
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
                </div>
                <ul className={`absolute top-full right-0 pt-[8px] transition-all duration-200 z-50 ${candidateDropdownOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
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
                      <Link href="/candidate-manage/interview-preparation" className="block py-[10px] px-[16px] font-[500] text-[15px] text-white">
                        Interview Preparation
                      </Link>
                    </li>
                    <li 
                      className="py-[10px] px-[16px] hover:bg-[#0000a0] font-[500] text-[15px] text-white cursor-pointer transition-colors duration-200"
                      onClick={() => handleLogout(`/candidate/login?redirect=${encodeURIComponent(pathname)}`)}
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
              <div 
                className="relative" 
                ref={companyRef}
                onPointerEnter={handleCompanyPointerEnter}
                onPointerLeave={handleCompanyPointerLeave}
              >
              <div 
                onClick={handleCompanyClick}
                className="flex items-center gap-[8px] cursor-pointer"
              >
                {infoCompany.logo ? (
                  <Image 
                    src={infoCompany.logo} 
                    alt={infoCompany.companyName || "Logo"}
                    width={32}
                    height={32}
                    className="w-[32px] h-[32px] rounded-full object-contain border-2 border-white bg-[#F6F6F6] p-[2px]"
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
              </div>
              <ul className={`absolute top-full right-0 pt-[8px] transition-all duration-200 z-50 ${companyDropdownOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}>
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
                    onClick={() => handleLogout(`/company/login?redirect=${encodeURIComponent(pathname)}`)}
                  >
                    Logout
                  </li>
                </div>
              </ul>
              </div>
            </div>
          )}
        </>) : (<>
          {/* Not logged in — skip redirect if currently on a login/register page to prevent redirect loops */}
          <Link href={`/candidate/login${/\/(login|register)/.test(pathname) ? "" : `?redirect=${encodeURIComponent(pathname)}`}`} className="">
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
