"use client";
import { usePathname } from "next/navigation";
import { Header } from "../header/Header";
import { Footer } from "../footer/Footer";
import type { ServerAuth } from "@/types/auth";

interface LayoutShellProps {
  serverAuth: ServerAuth;
  children: React.ReactNode;
}

export const LayoutShell = ({ serverAuth, children }: LayoutShellProps) => {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin-manage");

  if (isAdminRoute) {
    return <>{children}</>;
  }

  return (
    <>
      <Header serverAuth={serverAuth} />
      {children}
      <Footer serverAuth={serverAuth} />
    </>
  );
};
