/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { FaHeart, FaRegHeart } from "react-icons/fa6";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface FollowButtonProps {
  companyId: string;
}

export const FollowButton = ({ companyId }: FollowButtonProps) => {
  const { isLogin, infoCandidate, infoCompany, authLoading } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Only check follow status if user is logged in as candidate
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
  }, [companyId, authLoading, infoCandidate]);

  const handleToggleFollow = () => {
    if (!isLogin || !infoCandidate) {
      toast.error("Please login as a candidate to follow companies.");
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
  };

  // Hide while auth is loading
  if (authLoading) {
    return null;
  }

  // Hide if logged in as company
  if (infoCompany) {
    return null;
  }

  return (
    <button
      onClick={handleToggleFollow}
      disabled={loading}
      className={`inline-flex items-center gap-[8px] px-[20px] py-[10px] rounded-[8px] font-[600] text-[14px] cursor-pointer transition-all duration-200 ${
        following
          ? "bg-red-500 text-white hover:bg-red-600"
          : "bg-[#0088FF] text-white hover:bg-[#0066CC]"
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {following ? (
        <>
          <FaHeart className="text-[16px]" />
          Following
        </>
      ) : (
        <>
          <FaRegHeart className="text-[16px]" />
          Follow
        </>
      )}
    </button>
  );
};
