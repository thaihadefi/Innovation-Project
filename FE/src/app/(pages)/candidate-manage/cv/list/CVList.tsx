/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @next/next/no-img-element */
"use client"
import { cvStatusList, positionList, workingFormList, paginationConfig } from "@/configs/variable";
import Link from "next/link";
import { useEffect, useState } from "react";
import { FaBriefcase, FaCircleCheck, FaUserTie, FaMagnifyingGlass, FaXmark, FaTriangleExclamation, FaShieldHalved, FaLocationDot } from "react-icons/fa6";
import { toast } from "sonner";
import { Pagination } from "@/app/components/pagination/Pagination";
import { useAuth } from "@/hooks/useAuth";

const ITEMS_PER_PAGE = paginationConfig.candidateApplicationsList;

export const CVList = () => {
  const { infoCandidate, authLoading } = useAuth();
  const isVerified = infoCandidate?.isVerified || false;
  const [cvList, setCVList] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ show: boolean; cvId: string; jobTitle: string }>({
    show: false,
    cvId: "",
    jobTitle: ""
  });
  const [deleting, setDeleting] = useState(false);

  const fetchCVList = () => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/list`, {
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if(data.code == "success") {
          setCVList(data.cvList);
        }
      })
  };

  useEffect(() => {
    fetchCVList();
  }, []);

  // Filter applications by search term
  const filteredList = cvList.filter(item => {
    const search = searchTerm.toLowerCase();
    return (
      item.jobTitle?.toLowerCase().includes(search) ||
      item.companyName?.toLowerCase().includes(search)
    );
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

  const openDeleteModal = (cvId: string, jobTitle: string) => {
    setDeleteModal({ show: true, cvId, jobTitle });
  };

  const closeDeleteModal = () => {
    setDeleteModal({ show: false, cvId: "", jobTitle: "" });
  };

  const confirmDelete = () => {
    setDeleting(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/cv/delete/${deleteModal.cvId}`, {
      method: "DELETE",
      credentials: "include",
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          toast.success(data.message);
          fetchCVList();
        } else {
          toast.error(data.message);
        }
        setDeleting(false);
        closeDeleteModal();
      })
      .catch(() => {
        toast.error("Failed to delete application");
        setDeleting(false);
        closeDeleteModal();
      });
  };

  return (
    <>
      {/* Verification Prompt for Unverified Users */}
      {!authLoading && !isVerified && (
        <div className="mb-[24px] p-[20px] bg-amber-50 border border-amber-200 rounded-[8px]">
          <div className="flex items-start gap-[12px]">
            <FaShieldHalved className="text-[24px] text-amber-500 flex-shrink-0 mt-[2px]" />
            <div>
              <h3 className="font-[700] text-[16px] text-amber-700 mb-[4px]">
                Verify Your Student ID to Apply for Jobs
              </h3>
              <p className="text-[14px] text-amber-600 mb-[12px]">
                You need to verify your student ID before you can apply for jobs and view your applications.
              </p>
              <Link 
                href="/candidate-manage/profile" 
                className="inline-flex items-center gap-[8px] px-[16px] py-[8px] bg-amber-500 text-white rounded-[4px] font-[600] text-[14px] hover:bg-amber-600 transition-colors"
              >
                <FaShieldHalved />
                Verify Now
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Applications Section - Only visible for verified users */}
      {isVerified && (
        <>
          {/* Search Bar */}
          <div className="mb-[20px]">
        <div className="relative max-w-[400px]">
          <FaMagnifyingGlass className="absolute left-[16px] top-1/2 -translate-y-1/2 text-[#999]" />
          <input
            type="text"
            placeholder="Search by job title or company..."
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

      {/* Application List */}
      {cvList.length === 0 ? (
        <div className="text-center py-[40px] text-[#666]">
          <p>You haven&apos;t submitted any applications yet.</p>
          <Link href="/search" className="text-[#0088FF] hover:underline mt-[10px] inline-block">
            Browse jobs and apply!
          </Link>
        </div>
      ) : filteredList.length === 0 ? (
        <div className="text-center py-[40px] text-[#666]">
          <p>No applications found for &quot;{searchTerm}&quot;</p>
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
            {paginatedList.map((item) => {
              const position = positionList.find(pos => pos.value == item.position);
              const workingForm = workingFormList.find(work => work.value == item.workingForm);
              const cvStatus = cvStatusList.find(stt => stt.value == item.status);
              
              return (
                <div
                  key={item.id}
                  className="rounded-[8px] border border-[#DEDEDE] relative"
                  style={{
                    background: "linear-gradient(180deg, #F6F6F6 2.38%, #FFFFFF 70.43%)"
                  }}
                >
                  <img
                    src="/assets/images/card-bg.svg"
                    alt=""
                    className="absolute top-0 left-0 w-full h-auto"
                  />
                  <div className="relative">
                    <h3 className="pt-[20px] mx-[16px] mb-[6px] font-[700] sm:text-[18px] text-[14px] text-[#121212] text-center line-clamp-2">
                      {item.jobTitle}
                    </h3>
                    <div className="text-center mb-[6px] text-[14px] font-[400]">
                      Company: <span className="font-[700]">{item.companyName}</span>
                    </div>
                    <div className="font-[600] text-[16px] mb-[6px] text-center text-[#0088FF]">
                      {item.salaryMin?.toLocaleString("vi-VN")} VND - {item.salaryMax?.toLocaleString("vi-VN")} VND
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaUserTie className="text-[16px]" /> {position?.label}
                    </div>
                    <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                      <FaBriefcase className="text-[16px]" /> {workingForm?.label}
                    </div>
                    {item.jobCities && item.jobCities.length > 0 && (
                      <div className="flex items-center justify-center gap-[8px] font-[400] text-[14px] text-[#121212] mb-[6px]">
                        <FaLocationDot className="text-[16px]" /> 
                        {item.jobCities.slice(0, 3).join(", ") + (item.jobCities.length > 3 ? "..." : "")}
                      </div>
                    )}
                    {/* Technologies */}
                    <div className="flex flex-wrap items-center justify-center gap-[8px] mb-[16px] px-[16px]">
                      {(item.technologies || []).map((tech: string, idx: number) => (
                        <div 
                          key={idx}
                          className="border border-[#DEDEDE] rounded-[20px] py-[6px] px-[16px] font-[400] text-[12px] text-[#414042]"
                        >
                          {tech}
                        </div>
                      ))}
                    </div>
                    {/* Applied time ago */}
                    {item.appliedAt && (
                      <div className="text-center text-[12px] text-[#999] mb-[6px]">
                        Applied {(() => {
                          const diff = Date.now() - new Date(item.appliedAt).getTime();
                          const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                          if (days === 0) return "today";
                          if (days === 1) return "yesterday";
                          if (days < 7) return `${days} days ago`;
                          if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? "s" : ""} ago`;
                          return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? "s" : ""} ago`;
                        })()}
                      </div>
                    )}
                    <div 
                      className="flex items-center justify-center gap-[8px] font-[400] text-[14px] mb-[16px]"
                      style={{
                        color: cvStatus?.color
                      }}
                    >
                      <FaCircleCheck className="text-[16px]" /> {cvStatus?.label}
                    </div>
                    {/* Action Buttons */}
                    <div className="flex items-center justify-center gap-[12px] mb-[20px]">
                      <Link
                        href={`/candidate-manage/cv/view/${item.id}`}
                        className="bg-[#0088FF] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:bg-[#0077DD]"
                      >
                        View
                      </Link>
                      <Link
                        href={`/candidate-manage/cv/edit/${item.id}`}
                        className="bg-[#FFB200] rounded-[4px] font-[400] text-[14px] text-black inline-block py-[8px] px-[20px] hover:bg-[#E6A000]"
                      >
                        Edit
                      </Link>
                      <button
                        className="bg-[#FF0000] rounded-[4px] font-[400] text-[14px] text-white inline-block py-[8px] px-[20px] hover:bg-[#DD0000]"
                        onClick={() => openDeleteModal(item.id, item.jobTitle)}
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
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/50"
            onClick={closeDeleteModal}
          />
          {/* Modal */}
          <div className="relative bg-white rounded-[12px] p-[24px] max-w-[400px] w-[90%] shadow-xl">
            <div className="text-center">
              <div className="w-[60px] h-[60px] mx-auto mb-[16px] rounded-full bg-[#FEE2E2] flex items-center justify-center">
                <FaTriangleExclamation className="text-[28px] text-[#DC2626]" />
              </div>
              <h3 className="font-[700] text-[18px] text-[#121212] mb-[8px]">
                Delete Application?
              </h3>
              <p className="text-[#666] text-[14px] mb-[20px]">
                Are you sure you want to delete your application for{" "}
                <span className="font-[600] text-[#121212]">&quot;{deleteModal.jobTitle}&quot;</span>?
                <br />
                <span className="text-[#DC2626]">This action cannot be undone.</span>
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
      )}
    </>
  )
}