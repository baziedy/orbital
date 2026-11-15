import type { Metadata } from "next";
import "./globals.css";
import "@/styles/main.scss";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SiteGuide from "@/components/SiteGuide";
import FirstVisitTour from "@/components/FirstVisitTour";
import ScrollMotion from "@/components/ScrollMotion";
import BackendWarmup from "@/components/BackendWarmup";

export const metadata: Metadata = {
  title: "ORBITAL | SPHEREx Archive Explorer",
  description: "Explore released SPHEREx archive records and clearly identified reference imagery.",
};

const themeInitScript = `
(function() {
  try {
    var stored = localStorage.getItem('orbital-theme');
    var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body suppressHydrationWarning className="min-h-screen flex flex-col bg-[#F7F7F5] dark:bg-[#0A0B0E] text-[#111111] dark:text-[#F3F4F6] transition-colors duration-500">
        <BackendWarmup />
        <ScrollMotion />
        <Navbar />
        <div className="flex-1">
          {children}
        </div>
        <SiteGuide />
        <FirstVisitTour />
        <Footer />
      </body>
    </html>
  );
}
