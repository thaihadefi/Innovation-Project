import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/header/Header";
import { Footer } from "./components/footer/Footer";
import { Toaster } from "sonner";

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
    <html lang="en" suppressHydrationWarning>
      <body>
        <Toaster richColors position="top-right" duration={3000} />
        <Header />

        {children}

        <Footer />
      </body>
    </html>
  );
}
