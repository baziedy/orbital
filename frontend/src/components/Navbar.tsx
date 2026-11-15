"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import ThemeToggle from "@/components/ThemeToggle";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const reduceMotion = useReducedMotion();
  const isLinkActive = (href: string) =>
    pathname === href || (href !== "/" && pathname.startsWith(`${href}/`));

  useEffect(() => {
    if (!mobileMenuOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [mobileMenuOpen]);

  const navLinks = [
    { href: "/", label: "Discover" },
    { href: "/explore", label: "Explore" },
    { href: "/compare", label: "Compare" },
    { href: "/research", label: "My Research" },
    { href: "/about", label: "Mission" },
    { href: "/sources", label: "Sources" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-[#E7E7E4] bg-[#FFFFFF]/90 shadow-none backdrop-blur-xl transition-colors duration-500 dark:border-[#26282E] dark:bg-[#101114]/90">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-7 h-7 rounded-full border border-[#111111] dark:border-[#FFFFFF]/60 flex items-center justify-center relative overflow-hidden transition-transform group-hover:scale-105 bg-[#FFFFFF] dark:bg-[#12141A]">
            <div className="w-3.5 h-3.5 rounded-full border border-[#111111]/40 dark:border-[#FFFFFF]/40" />
            <div className="absolute w-1.5 h-1.5 rounded-full bg-[#111111] dark:bg-[#38BDF8]" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans font-bold tracking-widest text-sm text-[#111111] dark:text-[#FFFFFF]">ORBITAL</span>
            <span className="text-[9px] tracking-mega text-[#555555] dark:text-[#9CA3AF] font-semibold uppercase font-mono-sci -mt-0.5">SPHEREx DATA</span>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = isLinkActive(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive ? "page" : undefined}
                className={`site-nav-link text-xs uppercase tracking-widest transition-colors ${
                  isActive
                    ? "text-[#111111] dark:text-[#FFFFFF] font-bold"
                    : "text-[#555555] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#FFFFFF] font-medium"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link
            href="/explore"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-[#26282E] dark:hover:bg-[#E5E7EB] transition-all shadow-sm group"
          >
            <span>Launch Explorer</span>
            <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-[#111111] dark:text-[#FFFFFF] hover:bg-[#F7F7F5] dark:hover:bg-[#1A1D24] rounded-sm transition-colors"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            aria-controls="orbital-mobile-navigation"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {mobileMenuOpen && (
          <motion.div
            key="mobile-navigation"
            id="orbital-mobile-navigation"
            initial={{ opacity: 0, height: 0, y: -8 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -8 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-b border-[#E7E7E4] bg-[#FFFFFF] px-6 py-4 space-y-3 dark:border-[#26282E] dark:bg-[#101114] md:hidden"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-xs uppercase tracking-widest py-2 transition-colors ${
                  isLinkActive(link.href) ? "text-[#111111] dark:text-[#FFFFFF] font-bold" : "text-[#555555] dark:text-[#9CA3AF]"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2">
              <Link
                href="/explore"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex items-center justify-center w-full gap-2 px-4 py-2.5 bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] text-xs font-semibold tracking-widest uppercase rounded-sm"
              >
                <span>Launch Explorer</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
