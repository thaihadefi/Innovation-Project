import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { LayoutShell } from "./components/common/LayoutShell";
import { BackToTop } from "./components/common/BackToTop";
import { JobDataRefreshListener } from "./components/common/JobDataRefreshListener";
import { DisableNumberInputScroll } from "./components/common/DisableNumberInputScroll";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { AuthProvider } from "@/contexts/AuthContext";
import { SocketProvider } from "@/contexts/SocketContext";
import { getServerApiUrl } from "@/utils/get-server-api-url";

const lexend = Lexend({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  preload: true,
  variable: '--font-lexend',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: "UITJobs - IT Job Portal for UIT-ers",
  description: "Find your dream IT job. UITJobs connects UIT students and alumni with top tech companies in Vietnam."
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  let serverAuth = null;
  
  if (token) {
    try {
      const apiUrl = getServerApiUrl();
      const res = await fetch(`${apiUrl}/auth/check`, {
        headers: { Cookie: `token=${token}` },
        cache: "no-store"
      });
      const data = await res.json();
      if (data.code === "success") {
        serverAuth = {
          infoCandidate: data.infoCandidate || null,
          infoCompany: data.infoCompany || null
        };
      }
    } catch { /* keep fallback values on error */ }
  }
  
  return (
    <html lang="en" suppressHydrationWarning className={lexend.variable}>
      <body className={`${lexend.className} antialiased`}>
        <AuthProvider initialAuth={serverAuth}>
          <SocketProvider>
            <Toaster richColors position="top-right" duration={3000} />
            <DisableNumberInputScroll />
            <LayoutShell serverAuth={serverAuth}>
              <JobDataRefreshListener />
              {children}
            </LayoutShell>
            <BackToTop />
          </SocketProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
