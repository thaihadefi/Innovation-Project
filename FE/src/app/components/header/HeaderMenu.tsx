"use client";
import Link from "next/link";
import { FaAngleDown, FaAngleRight, FaChevronDown } from "react-icons/fa6";
import { useEffect, useState } from "react";
import { paginationConfig } from "@/configs/variable";

interface ServerAuth {
  infoCandidate: any;
  infoCompany: any;
}

export const HeaderMenu = (props: {
  showMenu: boolean,
  onClose?: () => void,
  serverAuth: ServerAuth | null
}) => {
  const { showMenu, onClose, serverAuth } = props;
  const isLogin = !!(serverAuth?.infoCandidate || serverAuth?.infoCompany);
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [topCities, setTopCities] = useState<any[]>([]);
  
  // Mobile accordion state - track which menus are open
  const [openMenuIndex, setOpenMenuIndex] = useState<number | null>(null);
  const [openSubMenuIndex, setOpenSubMenuIndex] = useState<number | null>(null);

  // Reset accordion state when menu closes
  useEffect(() => {
    if (!showMenu) {
      setOpenMenuIndex(null);
      setOpenSubMenuIndex(null);
    }
  }, [showMenu]);

  useEffect(() => {
    // Fetch top skills for navbar
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/technologies`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
        if(data.code === "success" && data.topTechnologies) {
          setTopSkills(data.topTechnologies.slice(0, paginationConfig.navbarTopSkills).map((item: any) => item.slug || item.name));
        }
      })
      .catch(() => {
        setTopSkills(["HTML5", "CSS3", "Javascript", "ReactJS", "NodeJS"]);
      });

    // Fetch top companies for navbar
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/top-companies`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
        if(data.code === "success" && data.topCompanies) {
          setTopCompanies(data.topCompanies);
        }
      })
      .catch(() => {
        setTopCompanies([
          { companyName: "Techcombank", slug: null },
          { companyName: "FPT Software", slug: null },
          { companyName: "ABC.LTD", slug: null }
        ]);
      });

    // Fetch top cities by job count
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/city/top-cities`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
        if(data.code === "success" && data.topCities) {
          setTopCities(data.topCities);
        }
      })
      .catch(() => {
        setTopCities([
          { name: "Ha Noi", slug: "ha-noi-eccb52" },
          { name: "Ho Chi Minh", slug: "ho-chi-minh-eccb57" },
          { name: "Da Nang", slug: "da-nang-eccb55" }
        ]);
      });
  }, []);

  const menuList = [
    {
      name: "IT Jobs",
      link: "/search",
      children: [
        {
          name: "IT Jobs by Skills",
          link: "#",
          children: [
            ...topSkills.map(skill => ({
              name: skill,
              link: `/search?skill=${skill}`,
              children: []
            })),
            {
              name: "See All →",
              link: "/search",
              children: []
            }
          ]
        },
        {
          name: "IT Jobs by Location",
          link: "#",
          children: [
            ...topCities.map(city => ({
              name: city.name,
              link: `/search?city=${city.slug}`,
              children: []
            })),
            {
              name: "See All →",
              link: "/search",
              children: []
            },
          ]
        }
      ]
    },
    {
      name: "Top IT Companies",
      link: "/company/list",
      children: [
        ...topCompanies.map(company => ({
          name: company.companyName,
          link: company.slug ? `/company/detail/${company.slug}` : `/search?company=${company.companyName}`,
          children: []
        })),
        {
          name: "See All →",
          link: "/company/list",
          children: []
        }
      ]
    },
    {
      name: "Salary Insights",
      link: "/salary-insights",
      children: []
    },
    {
      name: "Employer",
      link: "#",
      isLogin: false,
      children: [
        {
          name: "Login",
          link: "/company/login",
          children: []
        },
        {
          name: "Register",
          link: "/company/register",
          children: []
        }
      ]
    }
  ];

  // Toggle menu on mobile (click-based)
  const handleMenuToggle = (index: number) => {
    setOpenMenuIndex(openMenuIndex === index ? null : index);
    setOpenSubMenuIndex(null); // Close submenu when switching menu
  };

  const handleSubMenuToggle = (index: number) => {
    setOpenSubMenuIndex(openSubMenuIndex === index ? null : index);
  };
  
  return (
    <>
      {/* Desktop Navigation - hover based */}
      <nav className="hidden lg:block">
        <ul className="flex gap-x-[30px]">
          {menuList.map((menu, index) => (
            <li 
              key={index} 
              className={
                "relative group " +
                (
                  menu.isLogin !== undefined && menu.isLogin !== isLogin ? 
                  "hidden" 
                  : 
                  "inline-flex items-center gap-x-[6px]"
                )
              }
            >
              <Link 
                href={menu.link} 
                className="font-[600] text-[16px] text-white hover:text-white/80 transition-colors duration-200"
              >
                {menu.name}
              </Link>
              {menu.children.length > 0 && (
                <>
                  <FaAngleDown className="text-white text-[14px]" />
                  <ul className="absolute top-full left-0 pt-[8px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div className="bg-[#000065] rounded-[8px] w-[240px] shadow-xl py-[8px]">
                      {menu.children.map((menuSub1, indexSub1) => (
                        <li key={indexSub1} className="relative group/sub">
                          <Link 
                            href={menuSub1.link} 
                            className="flex items-center justify-between py-[10px] px-[16px] text-white hover:bg-[#0000a0] transition-colors duration-200 cursor-pointer"
                          >
                            <span className="font-[500] text-[15px]">{menuSub1.name}</span>
                            {menuSub1.children.length > 0 && (
                              <FaAngleRight className="text-[12px] text-white/70" />
                            )}
                          </Link>
                          {menuSub1.children.length > 0 && (
                            <ul className="absolute top-0 left-full pl-[4px] opacity-0 invisible group-hover/sub:opacity-100 group-hover/sub:visible transition-all duration-200 z-50">
                              <div className="bg-[#000065] rounded-[8px] w-[200px] shadow-xl py-[8px]">
                                {menuSub1.children.map((menuSub2, indexSub2) => (
                                  <li key={indexSub2}>
                                    <Link 
                                      href={menuSub2.link} 
                                      className="block py-[10px] px-[16px] font-[500] text-[14px] text-white hover:bg-[#0000a0] transition-colors duration-200 cursor-pointer"
                                    >
                                      {menuSub2.name}
                                    </Link>
                                  </li>
                                ))}
                              </div>
                            </ul>
                          )}
                        </li>
                      ))}
                    </div>
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Mobile Navigation - click/tap based accordion */}
      <nav 
        className={`lg:hidden fixed top-0 left-0 w-[280px] h-full bg-[#000063] z-50 overflow-y-auto transition-transform duration-300 ${showMenu ? "translate-x-0" : "-translate-x-full"}`}
      >
        <ul className="py-[8px]">
          {menuList.map((menu, index) => {
            const isHidden = menu.isLogin !== undefined && menu.isLogin !== isLogin;
            if (isHidden) return null;

            const isOpen = openMenuIndex === index;
            const hasChildren = menu.children.length > 0;

            return (
              <li key={index} className="border-b border-white/10">
                <div className="flex items-center">
                  <Link 
                    href={menu.link} 
                    onClick={() => hasChildren ? undefined : onClose?.()}
                    className="flex-1 py-[14px] px-[20px] font-[600] text-[16px] text-white hover:bg-white/5 transition-colors duration-200"
                  >
                    {menu.name}
                  </Link>
                  {hasChildren && (
                    <button 
                      onClick={() => handleMenuToggle(index)}
                      className="p-[14px] pr-[20px] cursor-pointer hover:bg-white/5 transition-colors duration-200"
                      aria-label={isOpen ? "Collapse menu" : "Expand menu"}
                    >
                      <FaChevronDown 
                        className={`text-white text-[14px] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} 
                      />
                    </button>
                  )}
                </div>

                {/* Submenu Level 1 */}
                {hasChildren && (
                  <ul 
                    className={`bg-[#000050] overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[1000px]" : "max-h-0"}`}
                  >
                    {menu.children.map((menuSub1, indexSub1) => {
                      const isSubOpen = openSubMenuIndex === indexSub1;
                      const hasSubChildren = menuSub1.children.length > 0;
                      
                      return (
                        <li key={indexSub1}>
                          <div className="flex items-center">
                            <Link 
                              href={menuSub1.link}
                              onClick={() => hasSubChildren ? undefined : onClose?.()}
                              className="flex-1 py-[12px] pl-[32px] pr-[16px] font-[500] text-[15px] text-white/90 hover:bg-white/5 transition-colors duration-200"
                            >
                              {menuSub1.name}
                            </Link>
                            {hasSubChildren && (
                              <button 
                                onClick={() => handleSubMenuToggle(indexSub1)}
                                className="p-[12px] pr-[20px] cursor-pointer hover:bg-white/5 transition-colors duration-200"
                                aria-label={isSubOpen ? "Collapse submenu" : "Expand submenu"}
                              >
                                <FaChevronDown 
                                  className={`text-white/70 text-[12px] transition-transform duration-200 ${isSubOpen ? "rotate-180" : ""}`} 
                                />
                              </button>
                            )}
                          </div>

                          {/* Submenu Level 2 */}
                          {hasSubChildren && (
                            <ul 
                              className={`bg-[#000040] overflow-hidden transition-all duration-300 ${isSubOpen ? "max-h-[500px]" : "max-h-0"}`}
                            >
                              {menuSub1.children.map((menuSub2, indexSub2) => (
                                <li key={indexSub2}>
                                  <Link 
                                    href={menuSub2.link}
                                    onClick={() => onClose?.()}
                                    className="block py-[10px] pl-[48px] pr-[16px] font-[400] text-[14px] text-white/80 hover:bg-white/5 hover:text-white transition-colors duration-200"
                                  >
                                    {menuSub2.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
    </>
  )
}
