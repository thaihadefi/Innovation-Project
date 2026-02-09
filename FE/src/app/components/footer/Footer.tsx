"use client";
import Link from "next/link";
import { FaFacebook, FaLinkedin, FaEnvelope, FaYoutube, FaInstagram } from "react-icons/fa6";

interface ServerAuth {
  infoCandidate: any;
  infoCompany: any;
  candidateUnreadCount?: number;
  companyUnreadCount?: number;
}

interface FooterProps {
  serverAuth: ServerAuth | null;
}

export const Footer = ({ serverAuth }: FooterProps) => {
  const currentYear = new Date().getFullYear();
  const infoCandidate = serverAuth?.infoCandidate;
  const infoCompany = serverAuth?.infoCompany;
  
  return (
    <footer className="bg-[#000065] pt-[40px] pb-[24px]">
      <div className="container">
        {/* Main Footer Content */}
        <div className="grid md:grid-cols-4 sm:grid-cols-2 grid-cols-1 gap-[32px] mb-[32px]">
          {/* Brand */}
          <div>
            <Link href="/" className="font-[800] text-[28px] text-white inline-block mb-[12px]">
              UITJobs
            </Link>
            <p className="font-[400] text-[14px] text-[#A6A6A6] leading-[1.6]">
              The premier IT job portal connecting UIT students and alumni with top tech companies in Vietnam and abroad.
            </p>
            <p className="mt-[10px] font-[400] text-[14px] text-[#A6A6A6]">
              For recruitment inquiries, please contact: <a href="mailto:ctsv@uit.edu.vn" className="text-white hover:underline">ctsv@uit.edu.vn</a>
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-[700] text-[16px] text-white mb-[16px]">Quick Links</h4>
            <ul className="space-y-[10px]">
              <li>
                <Link href="/search" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                  Browse Jobs
                </Link>
              </li>
              <li>
                <Link href="/company/list" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                  Companies
                </Link>
              </li>
              <li>
                <Link href="/salary-insights" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                  Salary Insights
                </Link>
              </li>
            </ul>
          </div>

          {/* For Candidates - Show different links based on login state */}
          <div>
            <h4 className="font-[700] text-[16px] text-white mb-[16px]">For Candidates</h4>
            <ul className="space-y-[10px]">
              {infoCandidate ? (
                // Logged in as candidate
                <>
                  <li>
                    <Link href="/candidate-manage/profile" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      My Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate-manage/cv/list" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      My Applications
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate-manage/followed-companies" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Followed Companies
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate-manage/saved-jobs" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Saved Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate-manage/recommendations" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Recommended Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate-manage/interview-tips" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Interview Tips
                    </Link>
                  </li>
                </>
              ) : (
                // Not logged in or logged in as company
                <>
                  <li>
                    <Link href="/candidate/register" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Create Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/candidate/login" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Login
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* For Employers - Show different links based on login state */}
          <div>
            <h4 className="font-[700] text-[16px] text-white mb-[16px]">For Employers</h4>
            <ul className="space-y-[10px]">
              {infoCompany ? (
                // Logged in as company
                <>
                  <li>
                    <Link href="/company-manage/profile" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Company Profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/company-manage/job/list" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Manage Jobs
                    </Link>
                  </li>
                  <li>
                    <Link href="/company-manage/cv/list" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Applications
                    </Link>
                  </li>
                  <li>
                    <Link href="/company-manage/analytics" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Analytics
                    </Link>
                  </li>
                </>
              ) : (
                // Not logged in or logged in as candidate
                <>
                  <li>
                    <Link href="/company/register" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Create Account
                    </Link>
                  </li>
                  <li>
                    <Link href="/company/login" className="font-[400] text-[14px] text-[#A6A6A6] hover:text-white transition-colors duration-200">
                      Login
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-[#ffffff15] pt-[24px]">
          <div className="flex flex-wrap items-center justify-between gap-[16px]">
            {/* Copyright */}
            <div className="font-[400] text-[14px] text-[#A6A6A6]">
              © {currentYear} UITJobs. All rights reserved.
            </div>

            {/* Social Links */}
            <div className="flex items-center gap-[16px]">
              <a 
                href="mailto:info@uit.edu.vn" 
                className="text-[#A6A6A6] hover:text-white transition-colors duration-200"
                aria-label="Email"
              >
                <FaEnvelope className="text-[20px]" />
              </a>
              <a 
                href="https://www.facebook.com/UIT.Fanpage" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#A6A6A6] hover:text-white transition-colors duration-200"
                aria-label="Facebook"
              >
                <FaFacebook className="text-[20px]" />
              </a>
              <a 
                href="https://www.youtube.com/c/UITtv" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#A6A6A6] hover:text-white transition-colors duration-200"
                aria-label="YouTube"
              >   
                <FaYoutube className="text-[20px]" />
              </a>
              <a 
                href="https://www.instagram.com/uituniversity/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#A6A6A6] hover:text-white transition-colors duration-200"
                aria-label="Instagram"
              >
                <FaInstagram className="text-[20px]" />
              </a>
              <a 
                href="https://www.linkedin.com/school/university-of-information-technology/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-[#A6A6A6] hover:text-white transition-colors duration-200"
                aria-label="LinkedIn"
              >
                <FaLinkedin className="text-[20px]" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
