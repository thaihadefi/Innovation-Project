"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FaBuilding, FaXmark, FaMagnifyingGlass } from "react-icons/fa6";
import { toast, Toaster } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";

const logoBlurDataURL =
  "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRjZGNkY2Ii8+PC9zdmc+";

export const FollowedCompaniesClient = ({ initialCompanies }: { initialCompanies: any[] }) => {
  const [companies, setCompanies] = useState<any[]>(initialCompanies);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Filter companies based on search
  const filteredCompanies = searchQuery.trim() === ""
    ? companies
    : companies.filter(c => 
        c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
      );

  const handleUnfollow = (companyId: string) => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/follow/${companyId}`, {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success" && !data.following) {
          setCompanies(companies.filter(c => c._id !== companyId));
          toast.success("Unfollowed successfully!");
        }
      });
  };

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);
  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="pt-[30px] pb-[60px] min-h-[calc(100vh-200px)]">
      <Toaster richColors position="top-right" />
      <div className="container">
        <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[20px]">
          <h1 className="font-[700] text-[24px] text-[#121212]">
            Followed Companies ({filteredCompanies.length})
          </h1>
          
          {/* Search */}
          <div className="relative">
            <FaMagnifyingGlass className="absolute left-[12px] top-[50%] translate-y-[-50%] text-[#999]" />
            <input
              type="text"
              placeholder="Search company..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-[36px] pr-[16px] py-[10px] border border-[#DEDEDE] rounded-[4px] w-[250px] text-[14px]"
            />
          </div>
        </div>

        {filteredCompanies.length === 0 ? (
          <div className="text-center py-[40px]">
            <FaBuilding className="text-[48px] text-[#ccc] mx-auto mb-[16px]" />
            <p className="text-[#666] mb-[16px]">
              {searchQuery ? "No companies found." : "You haven't followed any companies yet."}
            </p>
            {!searchQuery && (
              <Link
                href="/company/list"
                className="inline-block bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[24px] py-[12px] rounded-[8px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
              >
                Browse Companies
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-[16px]">
              {paginatedCompanies.map((company) => (
                <div
                  key={company._id}
                  className="border border-[#DEDEDE] rounded-[8px] p-[16px] flex items-center gap-[12px] relative group hover:border-[#0088FF] transition-colors"
                >
                  <Link href={`/company/detail/${company.slug}`} className="flex-shrink-0">
                    {company.logo ? (
                      <Image
                        src={company.logo}
                        alt={company.companyName || "Logo"}
                        width={50}
                        height={50}
                        className="w-[50px] h-[50px] rounded-[4px] object-cover bg-[#F6F6F6]"
                        placeholder="blur"
                        blurDataURL={logoBlurDataURL}
                        loading="eager"
                        unoptimized={company.logo?.includes("localhost")}
                      />
                    ) : (
                      <div className="w-[50px] h-[50px] rounded-[4px] bg-gray-200 flex items-center justify-center">
                        <FaBuilding className="text-[20px] text-gray-400" />
                      </div>
                    )}
                  </Link>
                  <Link href={`/company/detail/${company.slug}`} className="flex-1 min-w-0">
                    <h3 className="font-[600] text-[15px] text-[#121212] hover:text-[#0088FF] truncate">
                      {company.companyName}
                    </h3>
                  </Link>
                  <button
                    onClick={() => handleUnfollow(company._id)}
                    className="p-[8px] rounded-full hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
                    title="Unfollow"
                  >
                    <FaXmark className="text-[14px]" />
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <Pagination
              currentPage={currentPage}
              totalPage={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
};
