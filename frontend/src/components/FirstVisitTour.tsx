"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Sparkles, X } from "lucide-react";

const TOUR_STEPS = [
  { eyebrow: "01 / EXPLORE", title: "Start with a target", body: "Search a name or coordinates, then inspect available observations, sky position, and spectral views.", href: "/explore", action: "Open Explore" },
  { eyebrow: "02 / COMPARE", title: "Review two epochs", body: "Choose two observations to compare their dates and previews. Treat image differences as visual clues, not scientific detections.", href: "/compare", action: "Open Compare" },
  { eyebrow: "03 / DATA CONTEXT", title: "Check the provenance", body: "Every result identifies its source, observation date, and whether it is live archive data or a curated illustration.", href: "/sources", action: "See data sources" },
  { eyebrow: "04 / NEED A HAND?", title: "Ask the ORBITAL Guide", body: "Use the orbital button at the lower right for quick answers, guided pointers, and shortcuts to the right workspace.", href: null, action: null },
];

const COMPLETE_KEY = "orbital-first-tour-complete-v1";

export default function FirstVisitTour() {
  const [step, setStep] = useState(0);
  const [open, setOpen] = useState(false);

  const finish = useCallback(() => {
    localStorage.setItem(COMPLETE_KEY, "true");
    setOpen(false);
  }, []);

  useEffect(() => {
    if (localStorage.getItem(COMPLETE_KEY) !== "true") {
      const timeout = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(timeout);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") finish();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, finish]);

  if (!open) return null;
  const current = TOUR_STEPS[step];

  return (
    <div className="orbital-tour-backdrop fixed inset-0 z-[90] flex items-center justify-center p-4" onMouseDown={(event) => {
      if (event.target === event.currentTarget) finish();
    }}>
      <section role="dialog" aria-modal="true" aria-labelledby="orbital-tour-title" className="orbital-tour-card w-full max-w-lg border border-[#E7E7E4] dark:border-[#26282E] bg-[#FFFFFF] dark:bg-[#12141A] p-6 shadow-2xl sm:p-8">
        <div className="flex items-center justify-between">
          <span className="inline-flex items-center gap-2 font-mono-sci text-[10px] font-semibold tracking-[.16em] text-[#0284C7]"><Sparkles className="h-3.5 w-3.5" /> ORBITAL QUICK TOUR</span>
          <button type="button" onClick={finish} aria-label="Skip tour" className="rounded p-2 text-[#737373] hover:bg-[#F7F7F5] hover:text-[#111111]"><X className="h-4 w-4" /></button>
        </div>
        <div className="mt-8 font-mono-sci text-[10px] tracking-[.16em] text-[#8A8A83]">{current.eyebrow}</div>
        <h2 id="orbital-tour-title" className="mt-2 font-editorial text-3xl text-[#111111]">{current.title}</h2>
        <p className="mt-3 min-h-16 text-sm leading-relaxed text-[#555555]">{current.body}</p>
        <div className="mt-7 flex items-center justify-between gap-3">
          <button type="button" onClick={finish} className="text-xs font-medium text-[#737373] underline decoration-[#D1D1CB] underline-offset-4 hover:text-[#111111]">Skip tour</button>
          <div className="flex items-center gap-1.5" aria-label={`Step ${step + 1} of ${TOUR_STEPS.length}`}>
            {TOUR_STEPS.map((_, index) => <span key={index} className={`h-1.5 rounded-full transition-all ${index === step ? "w-5 bg-[#0284C7]" : "w-1.5 bg-[#D1D1CB]"}`} />)}
          </div>
          {current.href ? <Link href={current.href} onClick={finish} className="inline-flex items-center gap-2 bg-[#111111] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303030]">{current.action}<ArrowRight className="h-3.5 w-3.5" /></Link> : step > 0 ? <button type="button" onClick={() => setStep((value) => value - 1)} className="inline-flex items-center gap-1 text-xs text-[#737373]"><ArrowLeft className="h-3.5 w-3.5" /> Back</button> : <span />}
        </div>
        {step < TOUR_STEPS.length - 1 && <button type="button" onClick={() => setStep((value) => value + 1)} className="mt-5 block ml-auto text-xs font-semibold text-[#0284C7] hover:text-[#0369A1]">Next step <ArrowRight className="ml-1 inline h-3 w-3" /></button>}
        {step === TOUR_STEPS.length - 1 && <button type="button" onClick={finish} className="mt-5 ml-auto block text-xs font-semibold text-[#0284C7] hover:text-[#0369A1]">Finish tour</button>}
      </section>
    </div>
  );
}
