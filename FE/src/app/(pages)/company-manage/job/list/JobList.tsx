/* eslint-disable @typescript-eslint/no-explicit-any */
"use client"
import Image from "next/image";
import { positionList, workingFormList, paginationConfig } from "@/configs/variable";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaBriefcase, FaUserTie, FaMagnifyingGlass, FaXmark, FaTriangleExclamation, FaLocationDot } from "react-icons/fa6";
import { toast } from 'sonner';
import { Pagination } from "@/app/components/pagination/Pagination";

const ITEMS_PER_PAGE = paginationConfig.companyJobList;

export const JobList = () => {
  const [jobList, setJobList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; id: string; title: string }>({
    show: false,
    id: "",
    title: ""
  });
  const [deleting, setDeleting] = useState(false);

  const fetchJobs = () => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/job/list`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "success") {
          setJobList(data.jobList);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false))
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Filter jobs by search term
  const filteredList = jobList.filter(item => {
    const search = searchTerm.toLowerCase();
    return item.title?.toLowerCase().includes(search);
  });

  // Pagination calculations
  const totalRecord = filteredList.length;
  const totalPage = Math.ceil(totalRecord / ITEMS_PER_PAGE);
  const skip = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedList = filteredList.slice(skip, skip + ITEMS_PER_PAGE);
  const currentCount = paginatedList.length;

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const openDeleteModal = (id: string, title: string) => {
    setDeleteModal({ show: true, id, title });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, id: "", title: "" });
  };

  const confirmDelete = () => {
    setDeleting(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/company/job/delete/${deleteModal.id}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "success") {
          toast.success(data.message);
          fetchJobs();
        } else {
          toast.error(data.message);
        }
        setDeleting(false);
        closeDeleteModal();
      })
      .catch(() => {
        toast.error("Failed to delete job");
        setDeleting(false);
        closeDeleteModal();
      });
  };

  return (
    <>
      {/* Search Bar */}
      <div className="mb-[20px]">
        <div className="relative max-w-[400px]">
          <FaMagnifyingGlass className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            type="text"
            placeholder="Search by job title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-[46px] rounded-[8px] border border-[#DEDEDE] pl-[44px] pr-[16px] font-[400] text-[14px] text-black focus:border-[#0088FF] outline-none"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-[16px] top-1/2 -translate-y-1/2 text-[#999] hover:text-[#666]"
            >
              <FaXmark />
            </button>
          )}
        </div>
      </div>

      {/* Job List */}
      {loading ? (
        <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
          {Array(6).fill(null).map((_, i) => (
            <div key={`skeleton-${i}`} className="rounded-[8px] border border-[#DEDEDE] p-[20px] animate-pulse">
              <div className="h-[20px] bg-[#E0E0E0] rounded mb-[12px] w-3/4 mx-auto"></div>
              <div className="h-[16px] bg-[#E0E0E0] rounded mb-[8px] w-1/2 mx-auto"></div>
              <div className="h-[14px] bg-[#E0E0E0] rounded mb-[6px] w-2/3 mx-auto"></div>
              <div className="h-[14px] bg-[#E0E0E0] rounded mb-[6px] w-2/3 mx-auto"></div>
              <div className="flex justify-center gap-[8px] mb-[16px]">
                <div className="h-[28px] w-[60px] bg-[#E0E0E0] rounded-[20px]"></div>
                <div className="h-[28px] w-[60px] bg-[#E0E0E0] rounded-[20px]"></div>
              </div>
              <div className="flex justify-center gap-[12px]">
                <div className="h-[36px] w-[60px] bg-[#E0E0E0] rounded"></div>
                <div className="h-[36px] w-[60px] bg-[#E0E0E0] rounded"></div>
                <div className="h-[36px] w-[60px] bg-[#E0E0E0] rounded"></div>
              </div>
            </div>
          ))}
        </div>
      ) : jobList.length === 0 ? (
        <div className="text-center py-[40px] text-[#666]">
          <p>You haven&apos;t created any jobs yet.</p>
          <Link href="/company-manage/job/create" className="text-[#0088FF] hover:underline mt-[10px] inline-block">
            Create your first job posting!
          </Link>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-[40px] text-[#666]">
          <p>No jobs found for &quot;{searchTerm}&quot;</p>
          <button
            onClick={() => setSearchTerm("")}
            className="text-[#0088FF] hover:underline mt-[10px] inline-block"
          >
            Clear search
          </button>
        </div>
      ) : (
        <>
          <div className="grid lg:grid-cols-3 sm:grid-cols-2 grid-cols-1 gap-[20px]">
            {paginatedList.map(item => {
              const position = positionList.find(pos => pos.value == item.position);
              const workingForm = workingFormList.find(work => work.value == item.workingForm);
              
              return (
                <div
                  key={item.id}
                  className="rounded-[8px] border border-[#DEDEDE] relative"
                  style={{
                    background: "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)"
                  }}
                >
                  <Image
                    src="/assets/images/card-bg.svg"
                    alt=""
                    width={300}
                    height={100}
                    className="absolute top-0 left-0 w-full h-auto"
                    priority={false}
                  />
                  <div className="relative">
                    <h3 className="pt-[20px] mx-[16px] mb-[6px] font-[700] sm:text-[18px] text-[14px] text-[#121212] text-center line-clamp-2">
                      {item.title}
                    </h3>
                    <div className="font-[600] text-[16px] mb-[6px] text-center text-[#0088FF]">
                      {item.salaryMin?.toLocaleString("vi-VN")} VND - {item.salaryMax?.toLocaleString("vi-VN")} VND
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaUserTie className="text-[16px]" /> {position?.label}
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaBriefcase className="text-[16px]" /> {workingForm?.label}
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaLocationDot className="text-[16px]" /> 
                      {item.jobCities && item.jobCities.length > 0 
                        ? item.jobCities.slice(0, 5).join(", ") + (item.jobCities.length > 5 ? "..." : "")
                        : "No location set"}
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-[8px] mb-[20px]">
                      {(item.technologySlugs || []).map((itemTech: string, indexTech: number) => (
                        <div 
                          key={indexTech}
                          className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]"
                        >
                          {itemTech}
                        </div>
                      ))}
                    </div>
                    {/* Application Stats */}
                    <div className="flex justify-center gap-[16px] mb-[16px] text-[12px]">
                      <div className="text-center">
                        <div className="font-[600] text-[#0088FF]">
                          {item.applicationCount || 0}/{item.maxApplications || '∞'}
                        </div>
                        <div className="text-[#666]">Applications</div>
                      </div>
                      <div className="text-center">
                        <div className={`font-[600] ${(item.maxApproved > 0 && item.approvedCount >= item.maxApproved) ? 'text-red-500' : 'text-green-600'}`}>
                          {item.approvedCount || 0}/{item.maxApproved || '∞'}
                        </div>
                        <div className="text-[#666]">Approved</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-center gap-[12px] mb-[20px]">
                      <Link
                        href={`/job/detail/${item.slug}`}
                        className="bg-[#0088FF] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:bg-[#0077DD]"
                      >
                        View
                      </Link>
                      <Link
                        href={`/company-manage/job/edit/${item.id}`}
                        className="bg-[#FFB200] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px] hover:bg-[#E6A000]"
                      >
                        Edit
                      </Link>
                      <button
                        className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:bg-[#DD0000]"
                        onClick={() => openDeleteModal(item.id, item.title)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPage={totalPage}
            totalRecord={totalRecord}
            skip={skip}
            currentCount={currentCount}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={closeDeleteModal} />
          <div className="relative bg-white rounded-[12px] p-[24px] max-w-[400px] w-[90%] shadow-xl">
            <div className="text-center">
              <div className="w-[60px] h-[60px] mx-auto mb-[16px] rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <FaTriangleExclamation className="text-[28px] text-[#DC2626]" />
              </div>
              <h3 className="font-[700] text-[18px] text-[#121212] mb-[8px]">
                Delete Job?
              </h3>
              <p className="text-[#666] text-[14px] mb-[20px]">
                Are you sure you want to delete{" "}
                <span className="font-[600] text-[#121212]">&quot;{deleteModal.title}&quot;</span>?
                <br />
                <span className="text-[#DC2626]">This will also delete all applications for this job.</span>
              </p>
              <div className="flex gap-[12px]">
                <button
                  onClick={closeDeleteModal}
                  disabled={deleting}
                  className="flex-1 h-[44px] rounded-[8px] border border-[#DEDEDE] font-[600] text-[14px] text-[#666] hover:bg-[#F5F5F5] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 h-[44px] rounded-[8px] bg-[#DC2626] font-[600] text-[14px] text-white hover:bg-[#B91C1C] disabled:opacity-50"
                >
                  {deleting ? "Deleting..." : "Delete"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}