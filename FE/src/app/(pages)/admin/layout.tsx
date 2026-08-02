"use client";
import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PageLoadingSkeleton } from "@/app/components/ui/Skeleton";

export default function AdminAuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Check if already logged in as admin
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success" && data.info) {
          const recoveryPaths = [
            "/admin/reset-password", 
            "/admin/otp-password", 
            "/admin/forgot-password"
          ];
          const isRecoveryPath = recoveryPaths.some(p => pathname.startsWith(p));
          
          if (!isRecoveryPath) {
            router.replace("/admin-manage/dashboard");
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
