"use client";
import { usePathname } from "next/navigation";
import { Header } from "../header/Header";
import { Footer } from "../footer/Footer";

interface ServerAuth {
  infoCandidate: any;
  infoCompany: any;
  candidateUnreadCount?: number;
  companyUnreadCount?: number;
}

interface LayoutShellProps {
  serverAuth: ServerAuth | null;
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
