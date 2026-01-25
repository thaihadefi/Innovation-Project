/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import Image from "next/image";
import { FaStar, FaThumbsUp, FaUser, FaTrash } from "react-icons/fa6";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import ReviewForm from "./ReviewForm";
import { toast } from "sonner";
import DOMPurify from "isomorphic-dompurify";

interface Review {
  id: string;
  candidateId: string;
  overallRating: number;
  ratings: {
    salary?: number;
    workLifeBalance?: number;
    career?: number;
    culture?: number;
    management?: number;
  };
  title: string;
  content: string;
  pros: string;
  cons: string;
  authorName: string;
  authorAvatar?: string;
  isAnonymous: boolean;
  helpfulCount: number;
  createdAt: string;
  isOwner?: boolean;
}

interface Stats {
  totalReviews: number;
  avgOverall: number;
  avgSalary?: number;
  avgWorkLifeBalance?: number;
  avgCareer?: number;
  avgCulture?: number;
  avgManagement?: number;
}

interface Pagination {
  currentPage: number;
  totalPages: number;
  totalReviews: number;
}

const StarRating = ({ rating, size = 16 }: { rating: number; size?: number }) => (
  <div className="flex gap-[2px]">
    {[1, 2, 3, 4, 5].map(i => (
      <FaStar
        key={i}
        className={i <= rating ? "text-[#FFB200]" : "text-[#E5E5E5]"}
        style={{ fontSize: size }}
      />
    ))}
  </div>
);

const RatingBar = ({ label, value }: { label: string; value?: number }) => {
  if (!value) return null;
  return (
    <div className="flex items-center gap-[8px] text-[13px]">
      <span className="w-[120px] text-[#666]">{label}</span>
      <div className="flex-1 h-[6px] bg-[#E5E5E5] rounded-full overflow-hidden">
        <div 
          className="h-full bg-[#FFB200] rounded-full" 
          style={{ width: `${(value / 5) * 100}%` }}
        />
      </div>
      <span className="w-[30px] text-right font-[600]">{value}</span>
    </div>
  );
};

type ReviewSectionProps = {
  companyId: string;
  companyName: string;
  initialReviews?: Review[];
  initialStats?: Stats | null;
  initialPagination?: Pagination | null;
  isCompanyViewer?: boolean;
};

export const ReviewSection = ({ 
  companyId, 
  companyName,
  initialReviews = [],
  initialStats = null,
  initialPagination = null,
  isCompanyViewer = false
}: ReviewSectionProps) => {
  const router = useRouter();
  const { isLogin, infoCandidate, infoCompany, authLoading } = useAuth();
  const isCandidate = isLogin && !!infoCandidate;
  // Use server-provided value first, then fall back to client auth
  const isCompany = isCompanyViewer || !!infoCompany;
  const candidateId = infoCandidate?.id;
  
  // Only show loading if we don't have any server data (stats indicates server fetch was done)
  const hasServerData = initialStats !== null || initialReviews.length > 0;
  const [loading, setLoading] = useState(!hasServerData);
  const [reviews, setReviews] = useState<Review[]>(initialReviews);
  const [stats, setStats] = useState<Stats | null>(initialStats);
  const [pagination, setPagination] = useState<Pagination | null>(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [deleteModal, setDeleteModal] = useState<string | null>(null); // reviewId to delete
  
  // Track if we've loaded initial data
  const hasInitialData = useRef(hasServerData);

  const fetchReviews = useCallback((page: number = 1) => {
    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/company/${companyId}?page=${page}`)
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setReviews(data.reviews);
          setStats(data.stats);
          setPagination(data.pagination);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [companyId]);

  const checkCanReview = useCallback(() => {
    if (isLogin && isCandidate) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/can-review/${companyId}`, {
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => {
          if (data.code === "success") {
            setCanReview(data.canReview);
          }
        });
    }
  }, [companyId, isLogin, isCandidate]);

  useEffect(() => {
    // Skip initial fetch if we have server data and on page 1
    if (!(hasInitialData.current && currentPage === 1)) {
      fetchReviews(currentPage);
    }
    checkCanReview();
  }, [companyId, isLogin, currentPage, fetchReviews, checkCanReview]);

  const handleHelpful = useCallback(async (reviewId: string) => {
    if (!isLogin) {
      toast.info("Please login to mark reviews as helpful", {
        action: {
          label: "Login",
          onClick: () => window.location.href = "/candidate/login"
        }
      });
      return;
    }
    
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/${reviewId}/helpful`, {
      method: "POST",
      credentials: "include"
    });
    const data = await res.json();
    
    if (data.code === "success") {
      setReviews(prev => prev.map(r => 
        r.id === reviewId ? { ...r, helpfulCount: data.helpfulCount } : r
      ));
    }
  }, [isLogin]);

  const handleDelete = useCallback(async (reviewId: string) => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/review/${reviewId}`, {
      method: "DELETE",
      credentials: "include"
    });
    const data = await res.json();

    if (data.code === "success") {
      toast.success(data.message);
      fetchReviews(currentPage);
      setCanReview(true);
    } else {
      toast.error(data.message);
    }
    setDeleteModal(null);
  }, [fetchReviews, currentPage]);

  const handleReviewSubmitted = useCallback(() => {
    setShowForm(false);
    fetchReviews(1);
    setCurrentPage(1);
    setCanReview(false);
  }, [fetchReviews]);

  if (loading && reviews.length === 0) {
    return (
      <div className="mt-[40px]">
        <div className="h-[28px] bg-gray-200 rounded w-[200px] mb-[24px] animate-pulse" />
        <div className="grid md:grid-cols-2 gap-[24px] mb-[32px]">
          <div className="bg-[#F9F9F9] rounded-[12px] p-[24px] animate-pulse">
            <div className="h-[48px] bg-gray-200 rounded w-[80px] mx-auto mb-[8px]" />
            <div className="h-[24px] bg-gray-200 rounded w-[120px] mx-auto" />
          </div>
          <div className="space-y-[12px] animate-pulse">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex items-center gap-[8px]">
                <div className="h-[14px] bg-gray-200 rounded w-[120px]" />
                <div className="flex-1 h-[6px] bg-gray-200 rounded-full" />
                <div className="h-[14px] bg-gray-200 rounded w-[30px]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-[40px]">
      <div className="flex flex-wrap items-center justify-between gap-[16px] mb-[24px]">
        <h2 className="font-[700] text-[24px] text-[#121212]">
          Company Reviews
        </h2>
        {/* Hide button for company users (use server prop first to prevent flash) */}
        {!isCompany && (authLoading ? null : (!isLogin || (isCandidate && canReview))) && (
          <button
            onClick={() => {
              if (!isLogin) {
                toast.info("Please login to write a review", {
                  action: {
                    label: "Login",
                    onClick: () => window.location.href = "/candidate/login"
                  }
                });
              } else {
                setShowForm(true);
              }
            }}
            className="bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white px-[20px] py-[10px] rounded-[6px] font-[600] hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30 cursor-pointer transition-all duration-200 active:scale-[0.98]"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Stats Summary */}
      {stats && stats.totalReviews > 0 ? (
        <div className="grid md:grid-cols-2 gap-[24px] mb-[32px]">
          {/* Overall Rating */}
          <div className="bg-[#F9F9F9] rounded-[12px] p-[24px] text-center">
            <div className="text-[48px] font-[700] text-[#121212] mb-[8px]">
              {stats.avgOverall}
            </div>
            <StarRating rating={Math.round(stats.avgOverall)} size={24} />
            <div className="text-[#666] text-[14px] mt-[8px]">
              Based on {stats.totalReviews} review{stats.totalReviews !== 1 ? "s" : ""}
            </div>
          </div>

          {/* Category Ratings */}
          <div className="space-y-[12px]">
            <RatingBar label="Salary & Benefits" value={stats.avgSalary} />
            <RatingBar label="Work-Life Balance" value={stats.avgWorkLifeBalance} />
            <RatingBar label="Career Growth" value={stats.avgCareer} />
            <RatingBar label="Culture" value={stats.avgCulture} />
            <RatingBar label="Management" value={stats.avgManagement} />
          </div>
        </div>
      ) : (
        <div className="text-center py-[40px] bg-[#F9F9F9] rounded-[12px] mb-[24px]">
          <p className="text-[#666]">
            {!authLoading && (isCandidate || !isLogin) ? "No reviews yet. Be the first to review!" : "No reviews yet."}
          </p>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-[20px]">
        {reviews.map(review => (
          <div key={review.id} className="border border-[#DEDEDE] rounded-[12px] p-[20px]">
            {/* Header */}
            <div className="flex items-start justify-between mb-[12px]">
              <div className="flex items-center gap-[12px]">
                <div className="w-[40px] h-[40px] rounded-full bg-[#E5E5E5] flex items-center justify-center overflow-hidden">
                  {review.authorAvatar ? (
                    <Image 
                      src={review.authorAvatar} 
                      alt="Author" 
                      width={40} 
                      height={40} 
                      className="w-full h-full object-cover"
                      unoptimized={review.authorAvatar?.includes("localhost")}
                    />
                  ) : (
                    <FaUser className="text-[#999]" />
                  )}
                </div>
                <div>
                  <div className="font-[600] text-[#121212]">{review.authorName}</div>
                  <div className="text-[12px] text-[#999]">
                    {new Date(review.createdAt).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </div>
                </div>
              </div>
              <StarRating rating={review.overallRating} />
            </div>

            {/* Content */}
            <h3 className="font-[600] text-[16px] text-[#121212] mb-[8px]">{review.title}</h3>
            <div 
              className="text-[14px] text-[#333] mb-[12px] prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(review.content) }}
            />

            {/* Pros/Cons */}
            {(review.pros || review.cons) && (
              <div className="grid md:grid-cols-2 gap-[16px] mb-[12px]">
                {review.pros && (
                  <div className="bg-[#E8F5E9] rounded-[8px] p-[12px]">
                    <div className="font-[600] text-[#47BE02] text-[12px] mb-[4px]">PROS</div>
                    <div className="text-[13px] text-[#333]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(review.pros) }} />
                  </div>
                )}
                {review.cons && (
                  <div className="bg-[#FFEBEE] rounded-[8px] p-[12px]">
                    <div className="font-[600] text-[#FF5100] text-[12px] mb-[4px]">CONS</div>
                    <div className="text-[13px] text-[#333]" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(review.cons) }} />
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-[16px]">
              <button
                onClick={() => handleHelpful(review.id)}
                className="flex items-center gap-[6px] text-[13px] text-[#666] hover:text-[#0088FF] cursor-pointer transition-all duration-200 hover:bg-[#0088FF]/10 px-[10px] py-[6px] rounded-[6px] -mx-[10px]"
              >
                <FaThumbsUp className="transition-transform duration-200 hover:scale-110" />
                Helpful ({review.helpfulCount})
              </button>
              
              {/* Delete button for own reviews */}
              {isCandidate && candidateId && review.candidateId === candidateId && (
                <button
                  onClick={() => setDeleteModal(review.id)}
                  className="flex items-center gap-[6px] text-[13px] text-[#999] hover:text-[#FF5100] transition-colors"
                >
                  <FaTrash />
                  Delete
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center gap-[8px] mt-[24px]">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-[12px] py-[8px] border border-[#DEDEDE] rounded-[6px] text-[14px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#0088FF] hover:text-[#0088FF] transition-colors duration-200"
          >
            Previous
          </button>
          <span className="px-[12px] py-[8px] text-[14px] text-[#666]">
            Page {currentPage} of {pagination.totalPages}
          </span>
          <button
            onClick={() => setCurrentPage(p => Math.min(pagination.totalPages, p + 1))}
            disabled={currentPage === pagination.totalPages}
            className="px-[12px] py-[8px] border border-[#DEDEDE] rounded-[6px] text-[14px] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:border-[#0088FF] hover:text-[#0088FF] transition-colors duration-200"
          >
            Next
          </button>
        </div>
      )}

      {/* Review Form Modal */}
      {showForm && (
        <ReviewForm
          companyId={companyId}
          companyName={companyName}
          onClose={() => setShowForm(false)}
          onSuccess={handleReviewSubmitted}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-[12px] p-[24px] w-full max-w-[400px] mx-[20px] shadow-xl">
            <h3 className="font-[700] text-[18px] text-[#121212] mb-[12px]">
              Delete Review?
            </h3>
            <p className="text-[14px] text-[#666] mb-[24px]">
              Are you sure you want to delete this review? This action cannot be undone.
            </p>
            <div className="flex gap-[12px]">
              <button
                onClick={() => setDeleteModal(null)}
                className="flex-1 h-[44px] border border-[#DEDEDE] rounded-[8px] font-[600] text-[#666] hover:bg-[#F9F9F9] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteModal)}
                className="flex-1 h-[44px] bg-[#FF5100] rounded-[8px] font-[600] text-white hover:bg-[#E64800] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
