/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { FaBuilding, FaXmark, FaMagnifyingGlass } from "react-icons/fa6";
import { toast, Toaster } from "sonner";

export default function FollowedCompaniesPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  useEffect(() => {
    fetchFollowedCompanies();
  }, []);

  useEffect(() => {
    // Filter companies based on search
    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      setFilteredCompanies(
        companies.filter(c => 
          c.companyName.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    setCurrentPage(1);
  }, [searchQuery, companies]);

  const fetchFollowedCompanies = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/followed-companies`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setCompanies(data.companies);
          setFilteredCompanies(data.companies);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

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
    <div className="pt-[30px] pb-[60px]">
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

        {loading ? (
          <div className="text-center py-[40px] text-[#666]">Loading...</div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-[40px]">
            <FaBuilding className="text-[48px] text-[#ccc] mx-auto mb-[16px]" />
            <p className="text-[#666] mb-[16px]">
              {searchQuery ? "No companies found." : "You haven't followed any companies yet."}
            </p>
            {!searchQuery && (
              <Link
                href="/company/list"
                className="inline-block bg-[#0088FF] text-white px-[24px] py-[12px] rounded-[4px] font-[600] hover:bg-[#0077DD]"
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
                      <img
                        src={company.logo}
                        alt={company.companyName}
                        className="w-[50px] h-[50px] rounded-[4px] object-cover"
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
            {totalPages > 1 && (
              <div className="flex justify-center gap-[8px] mt-[24px]">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-[12px] py-[8px] rounded-[4px] border border-[#DEDEDE] disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="px-[12px] py-[8px] text-[14px]">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-[12px] py-[8px] rounded-[4px] border border-[#DEDEDE] disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
