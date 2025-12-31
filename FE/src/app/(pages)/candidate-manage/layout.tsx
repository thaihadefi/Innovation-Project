"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CandidateManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if logged in as candidate
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success" && data.infoCandidate) {
          setIsAuthorized(true);
        } else {
          // Not logged in as candidate - redirect
          router.replace("/candidate/login");
        }
        setLoading(false);
      })
      .catch(() => {
        router.replace("/candidate/login");
        setLoading(false);
      });
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-[#999]">Loading...</div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}
