import type { Metadata } from "next";
import { Lexend } from "next/font/google";
import "./globals.css";
import { Header } from "./components/header/Header";
import { Footer } from "./components/footer/Footer";
import { BackToTop } from "./components/common/BackToTop";
import { JobDataRefreshListener } from "./components/common/JobDataRefreshListener";
import { DisableNumberInputScroll } from "./components/common/DisableNumberInputScroll";
import { Toaster } from "sonner";
import { cookies } from "next/headers";
import { AuthProvider } from "@/contexts/AuthContext";

const lexend = Lexend({
  subsets: ['latin', 'vietnamese'],
  display: 'swap',
  preload: true,
  variable: '--font-lexend',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: {
    default: "UITJobs - IT Job Portal for UIT-ers",
    template: "%s | UITJobs"
  },
  description: "Find your dream IT job. UITJobs connects UIT students and alumni with top tech companies in Vietnam."
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Fetch auth status on server to prevent flash
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  
  let serverAuth = null;
  let authFetchFailed = false;
  
  if (token) {
    try {
      // Use direct URL for server-side fetch (NEXT_PUBLIC_ vars only work on client)
      const apiUrl = process.env.API_URL || "http://localhost:4001";
      const res = await fetch(`${apiUrl}/auth/check`, {
        headers: { Cookie: `token=${token}` },
        cache: "no-store"
      });
      const data = await res.json();
      if (data.code === "success") {
        serverAuth = {
          infoCandidate: data.infoCandidate || null,
          infoCompany: data.infoCompany || null,
          candidateUnreadCount: 0,
          companyUnreadCount: 0
        };

        // Preload notification counts on server to prevent badge flash
        if (serverAuth.infoCandidate) {
          try {
            const notifRes = await fetch(`${apiUrl}/candidate/notifications`, {
              headers: { Cookie: `token=${token}` },
              cache: "no-store"
            });
            const notifData = await notifRes.json();
            if (notifData.code === "success") {
              serverAuth.candidateUnreadCount = notifData.unreadCount || 0;
            }
          } catch {
            // Ignore notification fetch errors
          }
        }

        if (serverAuth.infoCompany) {
          try {
            const notifRes = await fetch(`${apiUrl}/company/notifications`, {
              headers: { Cookie: `token=${token}` },
              cache: "no-store"
            });
            const notifData = await notifRes.json();
            if (notifData.code === "success") {
              serverAuth.companyUnreadCount = notifData.unreadCount || 0;
            }
          } catch {
            // Ignore notification fetch errors
          }
        }
      }
    } catch {
      // Auth check failed, user not logged in
      authFetchFailed = true;
    }
  }
  
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={lexend.variable}
      data-scroll-behavior="smooth"
    >
      <body className={`${lexend.className} antialiased`}>
        <AuthProvider initialAuth={authFetchFailed ? undefined : serverAuth}>
          <Toaster richColors position="top-right" duration={3000} />
          <DisableNumberInputScroll />
          <Header serverAuth={serverAuth} />
          <JobDataRefreshListener />

          {children}

          <Footer serverAuth={serverAuth} />
          <BackToTop />
        </AuthProvider>
      </body>
    </html>
  );
}
