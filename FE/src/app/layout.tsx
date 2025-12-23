import type { Metadata } from "next";
import "./globals.css";
import { Header } from "./components/header/Header";
import { Footer } from "./components/footer/Footer";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "UIT-UA.ITJobs",
  description: "UIT-UA.ITJobs - IT Recruitment Website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Toaster richColors position="top-right" />
        <Header />

        {children}

        <Footer />
      </body>
    </html>
  );
}
