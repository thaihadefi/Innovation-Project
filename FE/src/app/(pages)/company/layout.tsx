"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PageLoadingSkeleton } from "@/app/components/ui/Skeleton";

export default function CompanyAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success" && data.infoCompany) {
          const publicPaths = [
            "/company/reset-password", 
            "/company/otp-password", 
            "/company/forgot-password",
            "/company/detail",
            "/company/list"
          ];
          const isPublicPath = publicPaths.some(p => pathname.startsWith(p));
          
          if (!isPublicPath) {
            router.replace("/company-manage/profile");
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
    return <PageLoadingSkeleton />;
  }

  return <>{children}</>;
}
