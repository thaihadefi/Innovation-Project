/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState, memo, useCallback, useMemo } from "react"; // Add memo, useCallback, useMemo
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FollowButtonProps {
  companyId: string;
  initialFollowing?: boolean;
  isCompanyViewer?: boolean;
}

// Memoize component to prevent unnecessary re-renders
export const FollowButton = memo(({ companyId, initialFollowing = false, isCompanyViewer = false }: FollowButtonProps) => {
  const { isLogin, infoCandidate, infoCompany, authLoading } = useAuth();
  const [following, setFollowing] = useState(initialFollowing);
  const [loading, setLoading] = useState(false);

  // Hide immediately if server detected company viewer
  if (isCompanyViewer) {
    return null;
  }

  useEffect(() => {
    // Only check follow status if not provided and user is logged in as candidate
    if (initialFollowing !== undefined) {
      setFollowing(initialFollowing);
      return;
    }
    
    if (!authLoading && infoCandidate) {
      setLoading(true);
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/follow/check/${companyId}`, {
        credentials: "include"
      })
        .then(res => res.json())
        .then(data => {
          if (data.code === "success") {
            setFollowing(data.following);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [companyId, authLoading, infoCandidate, initialFollowing]);

  // Memoize callback to prevent re-creating on every render
  const handleToggleFollow = useCallback(() => {
    if (!isLogin || !infoCandidate) {
      toast.info("Please login to follow companies", {
        action: {
          label: "Login",
          onClick: () => window.location.href = "/candidate/login"
        }
      });
      return;
    }

    setLoading(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/follow/${companyId}`, {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setFollowing(data.following);
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
        setLoading(false);
      })
      .catch(() => {
        toast.error("Failed!");
        setLoading(false);
      });
  }, [isLogin, infoCandidate, companyId]);

  // Memoize className calculation
  const buttonClassName = useMemo(() => 
    `inline-flex items-center gap-[8px] px-[20px] py-[10px] rounded-[8px] font-[600] text-[14px] cursor-pointer transition-all duration-200 active:scale-[0.97] ${
      following
        ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 hover:shadow-lg hover:shadow-red-500/30"
        : "bg-gradient-to-r from-[#0088FF] to-[#0066CC] text-white hover:from-[#0077EE] hover:to-[#0055BB] hover:shadow-lg hover:shadow-[#0088FF]/30"
    } disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none`
  , [following]);

  // Hide if logged in as company
  if (infoCompany) {
    return null;
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading || authLoading}
      className={buttonClassName}
    >
      {loading || authLoading ? (
        <div className="w-[16px] h-[16px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
      ) : following ? (
        <FaHeart className="text-[16px] transition-transform duration-200 group-hover:scale-110" />
      ) : (
        <FaRegHeart className="text-[16px] transition-transform duration-200 group-hover:scale-110" />
      )}
      {following ? "Following" : "Follow"}
    </button>
  );
});

// Set display name for debugging
FollowButton.displayName = 'FollowButton';
