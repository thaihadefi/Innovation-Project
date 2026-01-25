import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Font optimization
import "./globals.css";
import { Header } from "./components/header/Header";
import { Footer } from "./components/footer/Footer";
import { Toaster } from "sonner";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={inter.variable}>
      <body className="font-sans antialiased">
        <Toaster richColors position="top-right" duration={3000} />
        <Header />

        {children}

        <Footer />
      </body>
    </html>
  );
}
