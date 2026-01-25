"use client";
import { useState, useEffect, memo, useCallback, useMemo } from "react"; // Add memo, useCallback, useMemo
import { FaBookmark, FaRegBookmark } from "react-icons/fa6";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface SaveJobButtonProps {
  jobId: string;
}

// OPTIMIZED: Memoize component to prevent unnecessary re-renders
export const SaveJobButton = memo(({ jobId }: SaveJobButtonProps) => {
  const { infoCandidate, infoCompany, authLoading } = useAuth();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);

  const isCandidate = !!infoCandidate && !infoCompany;

  useEffect(() => {
    if (authLoading) return;
    if (!isCandidate) {
      setLoading(false);
      return;
    }

    // Check save status
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/job/save/check/${jobId}`, {
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setSaved(data.saved);
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [jobId, isCandidate, authLoading]);

  // OPTIMIZED: Memoize callback to prevent re-creating on every render
  const handleToggleSave = useCallback(() => {
    if (!infoCandidate) {
      toast.error("Please login to save jobs!");
      return;
    }
    if (infoCompany) {
      toast.error("Only candidates can save jobs!");
      return;
    }

    fetch(`${process.env.NEXT_PUBLIC_API_URL}/candidate/job/save/${jobId}`, {
      method: "POST",
      credentials: "include"
    })
      .then(res => res.json())
      .then(data => {
        if (data.code === "success") {
          setSaved(data.saved);
          toast.success(data.message);
        } else {
          toast.error(data.message);
        }
      })
      .catch(() => toast.error("Failed to save job!"));
  }, [infoCandidate, infoCompany, jobId]);

  // OPTIMIZED: Memoize className to prevent recalculation
  const buttonClassName = useMemo(() => 
    `flex items-center gap-[8px] px-[16px] py-[10px] rounded-[8px] border cursor-pointer transition-all duration-200 ${
      saved
        ? "bg-[#0088FF] border-[#0088FF] text-white hover:bg-[#0070d6]"
        : "border-[#DEDEDE] text-[#666] hover:border-[#0088FF] hover:text-[#0088FF] hover:bg-[#f0f9ff]"
    }`
  , [saved]);

  // Don't show for companies or while loading auth
  if (authLoading) {
    return null;
  }

  // Hide for company users
  if (infoCompany) {
    return null;
  }

  return (
    <button
      onClick={handleToggleSave}
      disabled={loading}
      className={buttonClassName}
      title={saved ? "Remove from saved" : "Save job"}
    >
      {saved ? (
        <FaBookmark className="text-[16px]" />
      ) : (
        <FaRegBookmark className="text-[16px]" />
      )}
      <span className="font-[500] text-[14px]">
        {saved ? "Saved" : "Save"}
      </span>
    </button>
  );
});

// Set display name for debugging
SaveJobButton.displayName = 'SaveJobButton';
