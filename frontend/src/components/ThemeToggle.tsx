"use client";

import { useEffect, useSyncExternalStore } from "react";
import { Sun, Moon } from "lucide-react";

const themeChangeEventName = "orbital-theme-change";

function getThemeSnapshot(): boolean {
  const stored = localStorage.getItem("orbital-theme");
  if (stored === "dark") return true;
  if (stored === "light") return false;
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function getServerThemeSnapshot(): boolean {
  return false;
}

function subscribeToTheme(callback: () => void): () => void {
  const preference = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener("storage", callback);
  window.addEventListener(themeChangeEventName, callback);
  preference.addEventListener("change", callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(themeChangeEventName, callback);
    preference.removeEventListener("change", callback);
  };
}

export default function ThemeToggle() {
  const isDark = useSyncExternalStore(subscribeToTheme, getThemeSnapshot, getServerThemeSnapshot);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
  }, [isDark]);

  const toggleTheme = () => {
    const nextDark = !isDark;
    localStorage.setItem("orbital-theme", nextDark ? "dark" : "light");
    document.documentElement.classList.toggle("dark", nextDark);
    window.dispatchEvent(new Event(themeChangeEventName));
  };

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to Light Mode" : "Switch to Dark Space Mode"}
      title={isDark ? "Light Mode (Editorial Paper)" : "Dark Mode (Deep Space)"}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border transition-all text-xs font-mono-sci border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] text-[#111111] dark:text-[#FFFFFF] hover:border-[#111111] dark:hover:border-[#FFFFFF] shadow-2xs"
    >
      {isDark ? (
        <>
          <Sun className="w-3.5 h-3.5 text-[#F59E0B]" />
          <span className="text-[10px] uppercase font-semibold hidden sm:inline">Light</span>
        </>
      ) : (
        <>
          <Moon className="w-3.5 h-3.5 text-[#0284C7]" />
          <span className="text-[10px] uppercase font-semibold hidden sm:inline">Dark</span>
        </>
      )}
    </button>
  );
}
