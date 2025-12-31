"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";

export default function CandidateAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already logged in as candidate
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success" && data.infoCandidate) {
          // Already logged in - redirect to profile (except for password reset pages)
          const publicPaths = ["/candidate/reset-password", "/candidate/otp-password", "/candidate/forgot-password"];
          const isPublicPath = publicPaths.some(p => pathname.startsWith(p));
          
          if (!isPublicPath) {
            router.replace("/candidate-manage/profile");
            return;
          }
        }
        setChecking(false);
      })
      .catch(() => {
        setChecking(false);
      });
  }, [router, pathname]);

  if (checking) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-[#999]">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
