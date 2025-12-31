"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function CompanyManageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if logged in as company
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/check`, {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code === "success" && data.infoCompany) {
          setIsAuthorized(true);
        } else {
          // Not logged in as company - redirect
          router.replace("/company/login");
        }
        setLoading(false);
      })
      .catch(() => {
        router.replace("/company/login");
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
