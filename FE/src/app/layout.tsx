import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Font optimization
import "./globals.css";
import { Header } from "./components/header/Header";
import { Footer } from "./components/footer/Footer";
import { BackToTop } from "./components/common/BackToTop";
import { Toaster } from "sonner";
import { cookies } from "next/headers";

// OPTIMIZED: Configure Inter font with optimal settings
const inter = Inter({
  subsets: ['latin', 'vietnamese'],
  display: 'swap', // Prevent invisible text during font load
  preload: true,
  variable: '--font-inter',
  weight: ['400', '500', '600', '700'], // Only load weights we use
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
          infoCompany: data.infoCompany || null
        };
      }
    } catch (error) {
      // Auth check failed, user not logged in
    }
  }
  
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <Toaster richColors position="top-right" duration={3000} />
        <Header serverAuth={serverAuth} />

        {children}

        <Footer serverAuth={serverAuth} />
        <BackToTop />
      </body>
    </html>
  );
}
