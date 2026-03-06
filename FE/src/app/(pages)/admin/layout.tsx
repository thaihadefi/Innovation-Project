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
  const [checking, setChecking] = useState(false); // Start as false to prevent flash

  useEffect(() => {
    // Check if already logged in as admin
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success") {
          // Already logged in - redirect to dashboard (except for public pages)
          const publicPaths = ["/admin/reset-password", "/admin/otp-password", "/admin/forgot-password"];
          const isPublicPath = publicPaths.some(p => pathname.startsWith(p));
          
          if (!isPublicPath) {
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
