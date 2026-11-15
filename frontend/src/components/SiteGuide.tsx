"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowUpRight, Compass, Database, Eye, Layers3, Orbit, Sparkles, Telescope, X } from "lucide-react";

function OrbitalMark({ small = false }: { small?: boolean }) {
  return (
    <span className={`orbital-mark ${small ? "orbital-mark-small" : ""}`} aria-hidden="true">
      <span className="orbital-mark-core" />
      <span className="orbital-mark-ring orbital-mark-ring-one" />
      <span className="orbital-mark-ring orbital-mark-ring-two" />
    </span>
  );
}

type GuideMessage = {
  role: "assistant" | "user";
  text: string;
  mode?: "local";
  destination?: string;
  destinationLabel?: string;
  keywords?: string[];
};

const QUICK_QUESTIONS = [
  { question: "How do I use Orbital?", title: "Take a quick tour", detail: "Find your way around", icon: Compass },
  { question: "How do I explore NASA imagery?", title: "Explore the sky", detail: "Search targets and previews", icon: Telescope },
  { question: "How does image comparison work?", title: "Compare images", detail: "Blink between two epochs", icon: Layers3 },
  { question: "How do I view the sky?", title: "Open the sky viewer", detail: "Navigate the live sky map", icon: Eye },
  { question: "Where can I find image sources?", title: "Check image sources", detail: "See archive links and credits", icon: Database },
  { question: "How do I create a research study?", title: "Start a research study", detail: "Organize images and notes", icon: Orbit },
];

export default function SiteGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [walkthrough, setWalkthrough] = useState<{ selector: string; title: string; text: string } | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const [isSending, setIsSending] = useState(false);
  const [messages, setMessages] = useState<GuideMessage[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const pending = sessionStorage.getItem("orbital-guide-walkthrough");
    if (!pending) return;
    let tour: { path: string; selector: string; title: string; text: string };
    try { tour = JSON.parse(pending) as typeof tour; } catch { sessionStorage.removeItem("orbital-guide-walkthrough"); return; }
    if (tour.path !== pathname) return;
    const frame = requestAnimationFrame(() => {
      const target = document.querySelector<HTMLElement>(tour.selector);
      if (!target) return;
      target.classList.add("orbital-guide-highlight");
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      setWalkthrough({ selector: tour.selector, title: tour.title, text: tour.text });
    });
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  const dismissWalkthrough = () => {
    if (walkthrough) document.querySelector(walkthrough.selector)?.classList.remove("orbital-guide-highlight");
    sessionStorage.removeItem("orbital-guide-walkthrough");
    setWalkthrough(null);
  };

  const startWalkthrough = (destination: string, label: string) => {
    const config = destination === "/compare"
      ? { selector: "[aria-label='Comparison modes']", text: "Choose Split Slider, Side by Side, or Blink to inspect two observations." }
      : destination === "/sources"
        ? { selector: "main", text: "Browse the linked archive, mission, and tutorial sources here." }
        : destination === "/research"
          ? { selector: "main", text: "Create a study, add image epochs, then compare and annotate your own material." }
          : destination === "/about"
            ? { selector: "main", text: "Read how ORBITAL presents its mission, scientific context, and example data." }
            : destination === "/explore" && label.toLowerCase().includes("sky viewer")
              ? { selector: "#sky-viewer-section", text: "Choose the CDS Aladin Interactive Atlas tab to pan and zoom across the sky." }
          : { selector: "#sky-target-query", text: "Choose a target or enter coordinates, then select an observation to open its image preview." };
    const path = destination || "/explore";
    sessionStorage.setItem("orbital-guide-walkthrough", JSON.stringify({ path, ...config, title: label }));
    setIsOpen(false);
    if (pathname === path) {
      window.setTimeout(() => {
        const target = document.querySelector<HTMLElement>(config.selector);
        target?.classList.add("orbital-guide-highlight");
        target?.scrollIntoView({ behavior: "smooth", block: "center" });
        if (target) setWalkthrough({ selector: config.selector, title: label, text: config.text });
      }, 0);
    } else router.push(path);
  };

  const closeGuide = useCallback(() => {
    setIsOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus());
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [messages, isSending]);

  useEffect(() => {
    if (!isOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeGuide();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [isOpen, closeGuide]);

  async function sendMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || isSending) return;

    setMessages((current) => [...current, { role: "user", text: trimmed }]);
    setIsSending(true);

    try {
      const response = await fetch("/api/guide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed }),
      });
      if (!response.ok) throw new Error("The guide is temporarily unavailable.");
      const result = await response.json();
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: result.answer,
          mode: "local",
          destination: result.destination,
          destinationLabel: result.destination_label,
          keywords: result.keywords || [],
        },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: "I couldn't reach the guide just now. You can still use these shortcuts to open Explore, Compare, My Research, or the source library.",
          mode: "local",
        },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <>
      {isOpen && (
        <section
          id="orbital-site-guide"
          role="dialog"
          aria-modal="false"
          aria-label="ORBITAL site guide"
          className="orbital-guide-enter orbital-guide-panel fixed right-3 z-[70] flex flex-col overflow-hidden rounded-xl border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] shadow-2xl sm:right-6"
        >
          <header className="orbital-guide-header relative flex flex-col items-center border-b border-[#E7E7E4] bg-white px-4 pb-3 pt-4 text-center dark:border-[#26282E] dark:bg-[#12141A]">
            <span className="orbital-guide-avatar mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-[#111111] text-white dark:bg-[#FFFFFF] dark:text-[#111111]">
              <OrbitalMark />
            </span>
            <h2 className="text-sm font-semibold tracking-wide text-[#111111] dark:text-[#F3F4F6]">ORBITAL Guide</h2>
            <p className="mt-0.5 text-[11px] text-[#737373] dark:text-[#9CA3AF]">Your guide to the universe of Orbital</p>
            <button
              type="button"
              onClick={closeGuide}
              aria-label="Close site guide"
              className="rounded-full p-2 text-[#737373] transition hover:bg-[#F7F7F5] hover:text-[#111111] dark:hover:bg-[#1A1D26] dark:hover:text-white"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </header>

          <div className="flex-1 space-y-4 overflow-y-auto bg-[#FAFAF8] p-4 dark:bg-[#161820]" aria-live="polite" aria-busy={isSending}>
            {messages.length === 0 ? (
              <div className="orbital-guide-welcome orbital-message-enter flex flex-col items-center px-1 pb-1 pt-1 text-center">
                <div className="orbital-guide-welcome-orb mb-2 flex h-16 w-16 items-center justify-center rounded-full bg-[#101114] text-white dark:bg-[#090A0D]">
                  <OrbitalMark />
                </div>
                <span className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 font-mono-sci text-[9px] font-semibold uppercase tracking-wider text-rose-800 dark:border-rose-900/70 dark:bg-rose-950/40 dark:text-rose-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Ready to explore
                </span>
                <h3 className="font-editorial text-2xl leading-tight text-[#111111] dark:text-[#F3F4F6]">Where should we go?</h3>
                <p className="mt-1 max-w-[18rem] text-[11px] leading-relaxed text-[#666666] dark:text-[#A1A1AA]">Pick a question and I’ll point you to the right place, with a quick guide along the way.</p>
              </div>
            ) : (
              <div className="space-y-3" aria-label="Conversation">
                {messages.map((message, index) => (
                  <div key={`${message.role}-${index}`} className={`orbital-message-enter flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    {message.role === "assistant" && (
                      <span className="mr-2 mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#111111] text-white dark:bg-[#0B0C10]">
                        <OrbitalMark small />
                      </span>
                    )}
                    <div className={`max-w-[86%] rounded-2xl px-3.5 py-3 text-xs leading-relaxed ${message.role === "user" ? "rounded-br-md bg-[#111111] text-white dark:bg-[#E5E7EB] dark:text-[#111111]" : "rounded-bl-md border border-[#E7E7E4] bg-white text-[#343434] dark:border-[#30333C] dark:bg-[#12141A] dark:text-[#E5E7EB]"}`}>
                      {message.role === "assistant" && <span className="mb-1.5 flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300"><Sparkles className="h-3 w-3" aria-hidden="true" /> Orbital guide</span>}
                      <p>{message.text}</p>
                      {message.destination && message.destinationLabel && (
                        <Link
                          href={message.destination}
                          onClick={(event) => { event.preventDefault(); startWalkthrough(message.destination!, message.destinationLabel!); }}
                          className="mt-3 inline-flex items-center gap-2 rounded-lg bg-rose-600 px-3 py-2 text-[11px] font-semibold text-white shadow-sm transition hover:bg-rose-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-500"
                        >
                          {message.destinationLabel}<ArrowUpRight className="h-3.5 w-3.5" />
                        </Link>
                      )}
                      {message.keywords && message.keywords.length > 0 && <div className="mt-3 flex flex-wrap gap-1.5">{message.keywords.slice(0, 4).map((keyword) => <button key={keyword} type="button" onClick={() => void sendMessage(keyword)} className="rounded-full border border-[#E7E7E4] px-2 py-1 text-[9px] text-[#555555] transition hover:border-rose-500 hover:text-rose-700 dark:border-[#343741] dark:text-[#C4C7CE] dark:hover:text-rose-300">{keyword}</button>)}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {isSending && (
              <p className="orbital-message-enter flex items-center gap-2 pl-2 text-xs text-[#737373] dark:text-[#A1A1AA]" role="status">
                <span className="orbital-typing-dots" aria-hidden="true"><i /><i /><i /></span>
                Finding your next stop…
              </p>
            )}
            {!isSending && messages.length > 0 && (
              <div className="pt-2">
                <p className="mb-2 px-1 text-[9px] font-semibold uppercase tracking-[.14em] text-[#8A8A83]">Explore another question</p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_QUESTIONS.map(({ question, title }) => (
                    <button key={question} type="button" onClick={() => void sendMessage(question)} className="rounded-full border border-[#E2E2DD] bg-white px-2.5 py-1.5 text-[10px] text-[#555555] transition hover:border-rose-500 hover:text-rose-700 dark:border-[#343741] dark:bg-[#12141A] dark:text-[#C4C7CE] dark:hover:text-rose-300">{title}</button>
                  ))}
                </div>
              </div>
            )}
            {messages.length === 0 && (
              <div className="space-y-2 pt-2">
                <p className="px-1 text-[9px] font-semibold uppercase tracking-[.14em] text-[#8A8A83]">Choose your next stop</p>
                <div className="grid grid-cols-2 gap-1.5">
                  {QUICK_QUESTIONS.map(({ question, title, detail, icon: Icon }) => (
                    <button key={question} type="button" disabled={isSending} onClick={() => void sendMessage(question)} className="orbital-guide-question group relative flex min-h-[58px] min-w-0 items-start gap-2 rounded-xl border border-[#E7E7E4] bg-white p-2 text-left transition duration-200 hover:-translate-y-0.5 hover:border-rose-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500 disabled:opacity-50 dark:border-[#30333C] dark:bg-[#12141A] dark:hover:border-rose-700">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-700 transition group-hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 dark:group-hover:bg-rose-900/60"><Icon className="h-3 w-3" aria-hidden="true" /></span>
                      <span className="min-w-0 flex-1"><span className="block truncate text-[10px] font-semibold text-[#222222] dark:text-[#F3F4F6]">{title}</span><span className="mt-0.5 block text-[9px] leading-snug text-[#737373] dark:text-[#9CA3AF]">{detail}</span></span>
                      <ArrowUpRight className="absolute right-2 top-2 h-3 w-3 text-[#A3A3A3] opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-[#E7E7E4] bg-white px-4 py-2.5 text-[9px] text-[#777777] dark:border-[#26282E] dark:bg-[#12141A] dark:text-[#9CA3AF]">
            <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Site guide ready</span>
            <span>Answers link to Orbital features</span>
          </div>
        </section>
      )}

      {walkthrough && <aside role="status" className="fixed bottom-24 left-4 z-[80] max-w-sm rounded-xl border border-rose-200 bg-white p-4 text-sm text-slate-800 shadow-xl dark:border-rose-900 dark:bg-slate-900 dark:text-slate-100"><div className="flex items-start justify-between gap-4"><div><strong className="block">{walkthrough.title}</strong><p className="mt-1 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{walkthrough.text}</p></div><button type="button" onClick={dismissWalkthrough} aria-label="Exit guide highlight" className="rounded p-1 hover:bg-rose-50 dark:hover:bg-rose-950/50"><X className="h-4 w-4"/></button></div></aside>}

      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-label={isOpen ? "Close ORBITAL site guide" : "Open ORBITAL site guide"}
        className="orbital-guide-trigger fixed right-3 z-[70] flex h-14 items-center gap-2 rounded-full bg-[#111111] dark:bg-[#FFFFFF] px-4 text-sm font-semibold text-white dark:text-[#111111] shadow-xl transition hover:-translate-y-0.5 hover:bg-[#303030] dark:hover:bg-[#E5E7EB] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111111] sm:right-6"
      >
        {isOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <OrbitalMark />}
        <span>{isOpen ? "Close" : "Ask Orbital"}</span>
      </button>
    </>
  );
}
