"use client";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";
import { FaAngleDown, FaAngleRight } from "react-icons/fa6";
import { useEffect, useState } from "react";

export const HeaderMenu = (props: {
  showMenu: boolean
}) => {
  const { showMenu } = props;
  const { isLogin } = useAuth();
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [topCompanies, setTopCompanies] = useState<any[]>([]);
  const [topCities, setTopCities] = useState<any[]>([]);

  useEffect(() => {
    // Fetch top skills for navbar
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/job/technologies`, { method: "GET" })
      .then(res => res.json())
      .then(data => {
          if(data.code === "success" && data.topTechnologies) {
          // Use slug as the displayed label (as requested)
          setTopSkills(data.topTechnologies.slice(0, 5).map((item: any) => item.slug || item.name));
        }
      })
      .catch(() => {
        // Fallback to hardcoded
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
        // Fallback to hardcoded
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
        // Fallback to hardcoded
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
              link: `/search?language=${skill}`,
              children: []
            })),
            {
              name: "See all →",
              link: "/search",
              children: []
            }
          ]
        },
        {
          name: "IT Jobs by City",
          link: "#",
          children: [
            ...topCities.map(city => ({
              name: city.name,
              link: `/search?city=${city.slug}`,
              children: []
            })),
            {
              name: "View All Cities →",
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
          name: "View All Companies →",
          link: "/company/list",
          children: []
        }
      ]
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
  
  return (
    <>
      <nav className={`lg:block ${showMenu ? "fixed top-0 left-0 w-[280px] h-full bg-[#000063] z-999" : "hidden"}`}>
        <ul className="flex gap-x-[30px] flex-wrap">
          {menuList.map((menu, index) => (
            <li 
              key={index} 
              className={
                "flex-wrap lg:w-auto w-full lg:justify-start justify-between items-center gap-x-[8px] relative group/sub-1 lg:p-0 p-[10px] " +
                (
                  menu.isLogin !== undefined && menu.isLogin !== isLogin ? 
                  "hidden" 
                  : 
                  "inline-flex"
                )
              }
            >
              <Link href={menu.link} className="font-[600] text-[16px] text-white">
                {menu.name}
              </Link>
              {menu.children.length > 0 && (
                <>
                  <FaAngleDown className="fa-solid fa-angle-down text-white text-[16px]" />
                  <ul className="lg:absolute relative lg:top-full top-0 left-0 bg-[#000065] rounded-[4px] lg:w-[280px] w-full hidden group-hover/sub-1:block">
                    {/* Sort the city dropdown alphabetically when rendering */}
                    {(
                      menu.name === "IT Jobs by City" ?
                        [...menu.children].sort((a: any, b: any) => a.name.localeCompare(b.name, 'vi')) :
                        menu.children
                    ).map((menuSub1, indexSub1) => (
                      <li key={indexSub1} className="rounded-[4px] flex flex-wrap items-center justify-between py-[10px] px-[16px] hover:bg-[#000096] relative group/sub-2">
                        <Link href={menuSub1.link} className="font-[600] text-[16px] text-white">
                          {menuSub1.name}
                        </Link>
                        {menuSub1.children.length > 0 && (
                          <>
                            <FaAngleRight className="fa-solid fa-angle-right text-[16px] text-white" />
                            <ul className="lg:absolute relative top-0 lg:left-[100%] left-0 bg-[#000065] rounded-[4px] lg:w-[280px] w-full hidden group-hover/sub-2:block">
                              {menuSub1.children.map((menuSub2, indexSub2) => (
                                <li key={indexSub2} className="rounded-[4px] flex items-center justify-between py-[10px] px-[16px] hover:bg-[#000096]">
                                  <Link href={menuSub2.link} className="font-[600] text-[16px] text-white">
                                    {menuSub2.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </li>
          ))}
        </ul>
      </nav>
    </>
  )
}