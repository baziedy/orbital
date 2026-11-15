"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  Activity,
  Eye,
  Sliders,
  Split,
  Layers,
  Globe,
  Play,
  Pause,
  Radio
} from "lucide-react";
import { fetchTargets, fetchObservations } from "@/lib/api";
import { TargetInfo, ObservationRecord } from "@/types";

const INITIAL_TARGETS: TargetInfo[] = [
  {
    id: "wise0855",
    name: "WISE 0855-0714",
    ra: 133.7951,
    dec: -7.2451,
    description: "Known Y-type brown dwarf included as a named search target. Its curated DSS reference images are not SPHEREx observations and do not show an ORBITAL detection.",
    object_type: "Y-type brown dwarf",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Explore this target field; motion is not measured from these images.",
  },
  {
    id: "barnard",
    name: "Barnard's Star",
    ra: 269.45208,
    dec: 4.69339,
    description: "Nearby red dwarf and a useful named target for multi-epoch image inspection. The local reference images do not measure its motion.",
    object_type: "Red dwarf star",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Compare the reference fields; source motion is not measured.",
  },
  {
    id: "epsindi",
    name: "Epsilon Indi Ba/Bb",
    ra: 331.04415,
    dec: -56.78284,
    description: "Epsilon Indi Ba/Bb is a brown-dwarf pair included as a named search target. The reference images do not resolve or measure the pair.",
    object_type: "Brown-dwarf pair",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Inspect the named target field; binary deblending is not performed.",
  },
  {
    id: "rwaur",
    name: "RW Aurigae",
    ra: 76.95375,
    dec: 30.40111,
    description: "Young stellar system included as a named search target. The curated reference images do not demonstrate variability or disk changes.",
    object_type: "Young stellar system",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Explore this target field; variability analysis is not performed.",
  },
  {
    id: "rdra",
    name: "R Draconis",
    ra: 248.3375,
    dec: 66.71194,
    description: "Mira-type variable star included as a named search target. The curated reference images do not measure its brightness or pulsation period.",
    object_type: "Mira-type variable star",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Explore this target field; no light curve is measured.",
  },
  {
    id: "kapteyn",
    name: "Kapteyn's Star",
    ra: 77.91917,
    dec: -45.01833,
    description: "Nearby red dwarf included as a named search target. Its velocity is not calculated from the local reference images.",
    object_type: "Red dwarf star",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Explore this target field; no velocity measurement is made.",
  },
  {
    id: "wolf359",
    name: "Wolf 359 (CN Leonis)",
    ra: 164.12083,
    dec: 7.01472,
    description: "Nearby red dwarf included as a named search target. ORBITAL does not identify flares in its reference images.",
    object_type: "Red dwarf star",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Explore this target field; flare analysis is not performed.",
  },
  {
    id: "mira",
    name: "Mira (Omicron Ceti)",
    ra: 34.84042,
    dec: -2.97778,
    description: "Mira-type variable star included as a named search target. The curated reference images do not measure its brightness or pulsation period.",
    object_type: "Mira-type variable star",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Explore this target field; no light curve is measured.",
  },
  {
    id: "teegarden",
    name: "Teegarden's Star",
    ra: 43.25375,
    dec: 16.88139,
    description: "Nearby red dwarf included as a named search target. ORBITAL does not measure its motion from these reference images.",
    object_type: "Red dwarf star",
    proper_motion: "",
    spectral_interest: "Reference context only; the image preview contains no measured spectrum.",
    challenge_relevance: "Explore this target field; no motion measurement is made.",
  },
];

const HERO_CONSOLE_TARGETS = [
  {
    id: "wise",
    name: "WISE 0855-0714",
    targetName: "WISE 0855-0714",
    coords: "RA 133.795° / Dec -7.245°",
    contextNote: "Named reference target; no SPHEREx detection or measured motion here",
    exploreTarget: "WISE 0855-0714",
  },
  {
    id: "barnard",
    name: "Barnard's Star",
    targetName: "Barnard's Star",
    coords: "RA 269.452° / Dec +4.693°",
    contextNote: "Named challenge target; ORBITAL does not measure its motion",
    exploreTarget: "Barnard's Star",
  },
  {
    id: "epsindi",
    name: "Epsilon Indi Ba/Bb",
    targetName: "Epsilon Indi Ba/Bb",
    coords: "RA 331.044° / Dec -56.783°",
    contextNote: "Named challenge target; the local reference images do not resolve the pair",
    exploreTarget: "Epsilon Indi Ba/Bb",
  },
];

export default function LandingPage() {
  const [targets, setTargets] = useState<TargetInfo[]>(INITIAL_TARGETS);
  const [selectedHeroIndex, setSelectedHeroIndex] = useState<number>(0);
  const [activePassIndex, setActivePassIndex] = useState<number>(0);
  const [isHeroAutoBlinking, setIsHeroAutoBlinking] = useState<boolean>(false);
  const [consoleObs, setConsoleObs] = useState<ObservationRecord[][]>([[], [], []]);
  const [imgLoadKey, setImgLoadKey] = useState<number>(0);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTargets()
      .then((res) => {
        if (res && res.length > 0) {
          setTargets(res);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchObservations()
      .then((all) => {
        const grouped = HERO_CONSOLE_TARGETS.map((t) => {
          const nameLower = t.targetName.toLowerCase().replace(/[-_\s]/g, "");
          return all
            .filter((o) => o.is_demo && o.target_name.toLowerCase().replace(/[-_\s]/g, "") === nameLower)
            .sort((a, b) => a.observation_id.localeCompare(b.observation_id));
        });
        setConsoleObs(grouped);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!isHeroAutoBlinking) return;
    const passes = consoleObs[selectedHeroIndex];
    const total = passes.length || 2;
    const interval = setInterval(() => {
      setActivePassIndex((prev) => (prev + 1) % total);
      setImgLoadKey((k) => k + 1);
    }, 1300);
    return () => clearInterval(interval);
  }, [isHeroAutoBlinking, consoleObs, selectedHeroIndex]);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gsap-hero-ribbon",
        { opacity: 0, y: -14 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out" }
      );
      gsap.fromTo(
        ".gsap-hero-badge",
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power3.out", delay: 0.1 }
      );
      gsap.fromTo(
        ".gsap-hero-title",
        { opacity: 0, y: 28 },
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", delay: 0.18 }
      );
      gsap.fromTo(
        ".gsap-hero-desc",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.75, ease: "power3.out", delay: 0.28 }
      );
      gsap.fromTo(
        ".gsap-hero-buttons",
        { opacity: 0, y: 18 },
        { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", delay: 0.38 }
      );
      gsap.fromTo(
        ".gsap-hero-media",
        { opacity: 0, y: 24, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.95, ease: "power3.out", delay: 0.25 }
      );

      gsap.fromTo(
        ".gsap-stat-item",
        { opacity: 0, y: 35, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.8,
          stagger: 0.1,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-stats-section",
            start: "top 86%",
            toggleActions: "play none none none",
          },
        }
      );

      gsap.fromTo(
        ".gsap-features-header",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-features-section",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
      gsap.fromTo(
        ".gsap-feature-card",
        { opacity: 0, y: 45, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-features-section",
            start: "top 78%",
            toggleActions: "play none none none",
          },
        }
      );

      gsap.fromTo(
        ".gsap-pillars-box",
        { opacity: 0, y: 40, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.95,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-pillars-section",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
      gsap.fromTo(
        ".gsap-pillar-col",
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.14,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-pillars-section",
            start: "top 75%",
            toggleActions: "play none none none",
          },
        }
      );

      gsap.fromTo(
        ".gsap-detective-header",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-detective-section",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
      gsap.fromTo(
        ".gsap-detective-card",
        { opacity: 0, y: 42 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-detective-section",
            start: "top 78%",
            toggleActions: "play none none none",
          },
        }
      );

      gsap.fromTo(
        ".gsap-targets-header",
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-targets-section",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
      gsap.fromTo(
        ".gsap-cta-content",
        { opacity: 0, y: 40, scale: 0.97 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.95,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".gsap-cta-section",
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );
    }, containerRef);

    const refreshFrame = requestAnimationFrame(() => ScrollTrigger.refresh());

    return () => {
      cancelAnimationFrame(refreshFrame);
      ctx.revert();
    };
  }, []);

  const currentHeroTarget = HERO_CONSOLE_TARGETS[selectedHeroIndex];
  const currentPasses = consoleObs[selectedHeroIndex] ?? [];
  const activeObs = currentPasses[activePassIndex] ?? null;
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";
  const activeImageSrc = activeObs
    ? `${BACKEND_URL}/api/images/${activeObs.observation_id}`
    : null;

  const scientificPillars = [
    {
      title: "Cosmic Inflation & Galaxy Origins",
      subtitle: "A large-scale map of galaxies",
      desc: "SPHEREx maps the sky in near-infrared spectral channels. Researchers can use its data to study cosmic history; ORBITAL does not analyze those science products.",
      metric: "All-sky",
      metricLabel: "SPHEREx survey coverage",
      icon: Globe,
    },
    {
      title: "Ices Between the Stars",
      subtitle: "Near-infrared spectra of the Milky Way",
      desc: "SPHEREx's wavelength coverage includes features used to study ices in interstellar clouds. ORBITAL displays image previews and does not extract spectra or identify molecules.",
      metric: "0.75–5.00 µm",
      metricLabel: "SPHEREx wavelength coverage",
      icon: Layers,
    },
    {
      title: "A Sky Revisited Over Time",
      subtitle: "The Planet X and SPHEREx challenge",
      desc: "The challenge focuses on making it easy to compare SPHEREx sky images across time. ORBITAL queries released archive records when available; curated reference-image sequences do not test Planet X or measure object motion.",
      metric: "6 months",
      metricLabel: "Challenge-brief survey cadence",
      icon: Activity,
    },
  ];

  const features = [
    {
      title: "Interactive Sky Explorer",
      desc: "Search the SPHEREx archive by sky coordinates or a supported object name and inspect returned metadata and FITS previews.",
      badge: "SIA v2 Protocol",
      icon: Eye,
      href: "/explore",
    },
    {
      title: "Multi-Epoch Blink Comparator",
      desc: "Cycle through selected archive images or clearly labeled DSS reference examples. ORBITAL does not detect or measure moving sources.",
      badge: "Image comparison",
      icon: Split,
      href: "/compare",
    },
    {
      title: "Display Difference",
      desc: "Subtract normalized preview pixels for visual exploration. Images are not WCS-registered or photometrically calibrated, so residuals are not detections.",
      badge: "Display only",
      icon: Sliders,
      href: "/compare",
    },
    {
      title: "Spectral Reference View",
      desc: "Explore illustrative wavelength curves beside current SPHEREx channel ranges. The curves are educational examples, not spectra measured from the selected target.",
      badge: "Illustrative",
      icon: Layers,
      href: "/explore",
    },
  ];

  const missionStats = [
    { value: "102", label: "Near-Infrared Channels", detail: "Across 0.75 to 5.00 µm" },
    { value: "6 Mo.", label: "All-Sky Map Cadence", detail: "About one map every six months" },
    { value: "11.3° × 3.5°", label: "Telescope Field of View", detail: "Per exposure" },
    { value: "~98 min", label: "Polar Orbit", detail: "Along Earth's day-night terminator" },
  ];

  return (
    <main ref={containerRef} className="space-y-20 md:space-y-24 pb-20 md:pb-24 overflow-hidden">
      <section className="relative isolate flex min-h-[calc(100svh-4rem)] w-full items-center overflow-hidden border-b border-[#E7E7E4] bg-[#F7F7F5] py-8 transition-colors duration-500 dark:border-[#26282E] dark:bg-[#0A0B0E] md:py-10">
        <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
          <Image
            src="/spherex_hero.jpg"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-center grayscale opacity-30 mix-blend-multiply dark:opacity-25 dark:mix-blend-screen"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#F7F7F5] via-[#F7F7F5]/90 to-[#F7F7F5]/45 dark:from-[#0A0B0E] dark:via-[#0A0B0E]/90 dark:to-[#0A0B0E]/45" />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#F7F7F5]/70 dark:to-[#0A0B0E]/75" />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl px-6">
          <div className="gsap-hero-ribbon mb-6 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono-sci text-[#737373] dark:text-[#9CA3AF] border-b border-[#E7E7E4] dark:border-[#26282E] pb-3">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#737373] dark:bg-[#9CA3AF]" />
              <span className="font-semibold text-[#111111] dark:text-[#FFFFFF] uppercase tracking-wider">
                SPHEREx MISSION CONTEXT
              </span>
              <span className="hidden sm:inline text-[#D1D1CB] dark:text-[#3A3D4D]">•</span>
              <span className="hidden sm:inline">102 INFRARED CHANNELS</span>
              <span className="hidden sm:inline text-[#D1D1CB] dark:text-[#3A3D4D]">•</span>
              <span className="hidden sm:inline">6-MONTH CADENCE</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] uppercase font-semibold">
                <span className="text-[#737373] dark:text-[#D1D5DB]">MISSION SPECIFICATIONS</span>
              <span className="text-[#D1D1CB] dark:text-[#3A3D4D]">•</span>
                <span className="text-[#737373] dark:text-[#D1D5DB]">SEE ABOUT PAGE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="gsap-hero-badge inline-flex items-center gap-2 border-l-2 border-[#111111] py-1 pl-3 text-xs font-mono-sci text-[#111111] dark:border-[#FFFFFF] dark:text-[#FFFFFF]">
                <Radio className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
                <span className="uppercase tracking-widest text-[11px] font-semibold">
                  ORBITAL • SPHEREx ARCHIVE EXPLORER
                </span>
              </div>

              <h1 className="gsap-hero-title text-4xl sm:text-6xl lg:text-7xl font-editorial tracking-tight text-[#111111] dark:text-[#FFFFFF] leading-[1.05]">
                EXPLORE THE SKY{" "}
                <span className="italic font-normal block text-[#111111] dark:text-[#FFFFFF] opacity-90">
                  ACROSS TIME.
                </span>
              </h1>

              <p className="gsap-hero-desc text-base sm:text-lg text-[#555555] dark:text-[#9CA3AF] font-light leading-relaxed max-w-xl">
                Search released SPHEREx archive records and inspect clearly labeled DSS reference images. ORBITAL does not make detections.
              </p>

              <div className="gsap-hero-buttons space-y-4 pt-1">
                <div className="flex flex-wrap items-center gap-3.5">
                  <Link
                    href="/explore"
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-[#26282E] dark:hover:bg-[#E5E7EB] transition-all shadow-sm group"
                  >
                    <span>Launch Sky Explorer</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href="/compare"
                    className="inline-flex items-center gap-2 px-6 py-3.5 bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] text-[#111111] dark:text-[#FFFFFF] text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-[#F7F7F5] dark:hover:bg-[#1A1D24] transition-all shadow-sm"
                  >
                    <span>Differential Studio</span>
                  </Link>
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-mono-sci text-[#737373] dark:text-[#9CA3AF]">
                  <span className="text-[10px] uppercase font-bold text-[#8A8A83]">Quick Launch:</span>
                  <Link
                    href="/explore?target=WISE%200855-0714"
                    className="underline decoration-[#D1D1CB] underline-offset-4 text-[#111111] dark:text-[#FFFFFF] hover:decoration-[#111111] dark:hover:decoration-[#FFFFFF] transition-colors"
                  >
                    WISE 0855-0714
                  </Link>
                  <Link
                    href="/explore?target=Barnard%27s%20Star"
                    className="underline decoration-[#D1D1CB] underline-offset-4 text-[#111111] dark:text-[#FFFFFF] hover:decoration-[#111111] dark:hover:decoration-[#FFFFFF] transition-colors"
                  >
                    Barnard&apos;s Star
                  </Link>
                  <a
                    href="#detective-story"
                    className="underline decoration-[#D1D1CB] underline-offset-4 text-[#737373] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#FFFFFF] transition-colors"
                  >
                    Tombaugh Detective Guide →
                  </a>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="gsap-hero-media rounded-sm border border-black/10 bg-white/75 p-4 shadow-2xl shadow-black/10 backdrop-blur-xl space-y-3.5 dark:border-white/10 dark:bg-[#101114]/75 dark:shadow-black/30">
                <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4] dark:border-[#26282E]">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3.5 h-3.5 text-[#0284C7] dark:text-[#38BDF8]" />
                    <span className="text-[10px] uppercase tracking-wider font-mono-sci font-bold text-[#111111] dark:text-[#FFFFFF]">
                      Archive Image Preview
                    </span>
                  </div>
                  <span className="text-[10px] font-mono-sci text-[#0284C7] dark:text-[#38BDF8] font-semibold">
                    {activeObs && !activeObs.is_demo ? `SPHEREx ${activeObs.band}` : "DSS reference images"}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 font-mono-sci text-[10px]">
                  {HERO_CONSOLE_TARGETS.map((t, idx) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setSelectedHeroIndex(idx);
                        setActivePassIndex(0);
                        setIsHeroAutoBlinking(false);
                        setImgLoadKey((k) => k + 1);
                      }}
                      className={`flex-1 py-1.5 px-2 rounded-[2px] border text-center transition-all truncate ${
                        selectedHeroIndex === idx
                          ? "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] border-[#111111] dark:border-[#FFFFFF] font-semibold shadow-xs"
                          : "bg-[#F7F7F5] dark:bg-[#1A1D24] border-[#E7E7E4] dark:border-[#26282E] text-[#555555] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
                      }`}
                    >
                      {t.id === "epsindi" ? "Eps Indi" : t.name.split(" ")[0]}
                    </button>
                  ))}
                </div>

                <div className="relative w-full h-[280px] sm:h-[320px] bg-[#101114] rounded-sm overflow-hidden border border-[#26282E] group select-none">
                  {activeImageSrc ? (
                    <img
                      key={`${selectedHeroIndex}-${activePassIndex}-${imgLoadKey}`}
                      src={activeImageSrc}
                      alt={`${currentHeroTarget.name} ${activeObs?.is_demo ? "DSS reference preview" : "SPHEREx archive preview"} ${activePassIndex + 1}`}
                      className="w-full h-full object-cover filter contrast-110 pointer-events-none transition-opacity duration-150"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-[10px] font-mono-sci text-[#4A4D5A] uppercase tracking-widest">Loading Reference Preview…</span>
                    </div>
                  )}

                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <svg className="w-24 h-24 overflow-visible" viewBox="0 0 96 96">
                      <circle cx="48" cy="48" r="42" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.65" />
                      <line x1="48" y1="4" x2="48" y2="92" stroke="#FFFFFF" strokeWidth="1" opacity="0.8" />
                      <line x1="4" y1="48" x2="92" y2="48" stroke="#FFFFFF" strokeWidth="1" opacity="0.8" />
                      <circle cx="48" cy="48" r="5" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                    </svg>
                  </div>

                  <div className="absolute top-3 left-3 right-3 flex flex-wrap items-start justify-between gap-2 pointer-events-none z-10">
                    <div className="bg-[#101114]/90 backdrop-blur-md px-2.5 py-1.5 border border-[#26282E] rounded-sm text-[10px] font-mono-sci text-[#FFFFFF] space-y-0.5 max-w-[calc(100%-130px)] sm:max-w-none">
                      <div className="flex items-center gap-1.5 truncate">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] shrink-0" />
                        <span className="font-bold truncate">{currentHeroTarget.name}</span>
                      </div>
                      <div className="text-[#9CA3AF] text-[9px] sm:text-[10px] truncate">Search center: {currentHeroTarget.coords}</div>
                    </div>

                    <div className="bg-[#101114]/90 backdrop-blur-md px-2.5 py-1.5 border border-[#26282E] rounded-sm text-[10px] font-mono-sci text-[#38BDF8] font-semibold text-right shrink-0">
                      {activeObs ? (
                        <div className="leading-tight">
                          <div>REFERENCE EXAMPLE</div>
                          <div className="text-[9px] text-[#9CA3AF] font-normal">DATE ILLUSTRATIVE</div>
                        </div>
                      ) : (
                        "REFERENCE PREVIEW"
                      )}
                    </div>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                    <div className="bg-[#101114]/90 backdrop-blur-md px-2.5 py-1 border border-[#26282E] rounded-sm text-[10px] font-mono-sci text-[#9CA3AF]">
                      MOTION: <span className="text-[#FFFFFF] font-semibold">Not measured here</span>
                    </div>

                    <button
                      onClick={() => setIsHeroAutoBlinking(!isHeroAutoBlinking)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-[10px] font-mono-sci font-bold uppercase tracking-wider transition-all backdrop-blur-md border ${
                        isHeroAutoBlinking
                          ? "bg-[#FFFFFF] text-[#111111] border-[#FFFFFF] shadow-xs"
                          : "bg-[#101114]/90 text-[#FFFFFF] border-[#26282E] hover:border-[#FFFFFF]"
                      }`}
                    >
                      {isHeroAutoBlinking ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                      <span>{isHeroAutoBlinking ? "Blinking Active" : "Auto Blink"}</span>
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-xs font-mono-sci">
                  <div className="flex items-center justify-between text-[11px] text-[#737373] dark:text-[#9CA3AF]">
                    <span>CONTEXT NOTE:</span>
                    <span className="text-[#111111] dark:text-[#FFFFFF] font-semibold text-right max-w-[240px] truncate">
                      {currentHeroTarget.contextNote}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-[#E7E7E4] dark:border-[#26282E] flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-[10px] flex-wrap">
                      {currentPasses.length > 0 ? (
                        currentPasses.map((obs, i) => (
                          <button
                            key={obs.observation_id}
                            onClick={() => {
                              setIsHeroAutoBlinking(false);
                              setActivePassIndex(i);
                              setImgLoadKey((k) => k + 1);
                            }}
                            className={`px-2.5 py-1 rounded-[2px] border transition-all ${
                              activePassIndex === i
                                ? "bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] border-[#111111] dark:border-[#FFFFFF] font-semibold"
                                : "bg-[#F7F7F5] dark:bg-[#1A1D24] border-[#E7E7E4] dark:border-[#26282E] text-[#555555] dark:text-[#9CA3AF] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
                            }`}
                          >
                            Example {i + 1}
                          </button>
                        ))
                      ) : (
                        [1, 2].map((n) => (
                          <button
                            key={n}
                            disabled
                            className="px-2.5 py-1 rounded-[2px] border border-[#E7E7E4] dark:border-[#26282E] text-[#D1D1CB] dark:text-[#4A4D5A] cursor-not-allowed"
                          >
                            Pass {n}
                          </button>
                        ))
                      )}
                    </div>

                    <Link
                      href={`/explore?target=${encodeURIComponent(currentHeroTarget.exploreTarget)}`}
                      className="inline-flex items-center gap-1 text-[11px] text-[#0284C7] dark:text-[#38BDF8] hover:underline font-semibold"
                    >
                      <span>Explore In Sky Atlas</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <a
          href="https://science.nasa.gov/photojournal/spherex-in-orbit-artists-concept/"
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-3 right-4 z-20 text-[10px] font-mono-sci text-[#737373] underline decoration-[#A3A3A3] underline-offset-2 dark:text-[#D1D5DB]"
        >
          Artist&apos;s concept · NASA/JPL-Caltech
        </a>
      </section>

      <section className="gsap-stats-section max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#E7E7E4] dark:divide-[#26282E] border border-[#E7E7E4] dark:border-[#26282E] rounded-sm">
          {missionStats.map((stat) => (
            <div key={stat.label} className="gsap-stat-item space-y-1 px-5 py-6">
              <span className="text-3xl sm:text-4xl font-editorial tracking-tight text-[#111111] dark:text-[#FFFFFF] font-normal block">
                {stat.value}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#111111] dark:text-[#E5E7EB] block">
                {stat.label}
              </span>
              <span className="text-[11px] text-[#737373] dark:text-[#9CA3AF] font-mono-sci block leading-snug">
                {stat.detail}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="gsap-features-section max-w-7xl mx-auto px-6">
        <div className="gsap-features-header flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 pb-6 border-b border-[#E7E7E4] dark:border-[#26282E]">
          <div>
            <span className="text-[10px] uppercase tracking-mega text-[#737373] dark:text-[#9CA3AF] font-bold font-mono-sci">Analytical Capabilities</span>
            <h2 className="text-3xl sm:text-4xl font-editorial tracking-tight text-[#111111] dark:text-[#FFFFFF] mt-1">
              Tools and Data Views
            </h2>
          </div>
          <p className="text-xs md:text-sm text-[#555555] dark:text-[#9CA3AF] max-w-md">
            Search released archive records, compare image previews, and explore SPHEREx data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <Link
                key={feat.title}
                href={feat.href}
                className="gsap-feature-card group border-t border-[#E7E7E4] py-6 transition-colors dark:border-[#26282E]"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 flex items-center justify-start text-[#111111] dark:text-[#FFFFFF] transition-transform group-hover:translate-x-1">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-mono-sci uppercase px-2 py-0.5 bg-[#F7F7F5] dark:bg-[#1A1D24] border border-[#E7E7E4] dark:border-[#26282E] text-[#737373] dark:text-[#9CA3AF] rounded-[2px] font-semibold">
                      {feat.badge}
                    </span>
                  </div>

                  <h3 className="text-lg font-editorial tracking-tight text-[#111111] dark:text-[#FFFFFF] mb-2 group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors">
                    {feat.title}
                  </h3>

                  <p className="text-xs text-[#555555] dark:text-[#9CA3AF] leading-relaxed">
                    {feat.desc}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-[#E7E7E4] dark:border-[#26282E] flex items-center justify-between text-xs font-mono-sci text-[#111111] dark:text-[#FFFFFF]">
                  <span className="text-[11px] uppercase tracking-wider font-semibold">Launch Tool</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="gsap-pillars-section max-w-7xl mx-auto px-6">
        <div className="gsap-pillars-box bg-[#101114] text-[#FFFFFF] px-8 py-10 md:px-14 md:py-14 border border-[#26282E] rounded-sm shadow-none space-y-10">
          <div className="max-w-3xl space-y-2">
            <span className="text-[10px] uppercase tracking-mega text-[#38BDF8] font-mono-sci font-bold">
              Astrophysics Framework
            </span>
            <h2 className="text-3xl sm:text-4xl font-editorial tracking-tight text-[#FFFFFF]">
              The Three Foundational Pillars
            </h2>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
              Mission science context from NASA and the IRSA archive. ORBITAL does not perform these analyses.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4 border-t border-[#26282E]">
            {scientificPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div key={pillar.title} className="gsap-pillar-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-8 h-8 rounded-sm bg-[#1A1C23] border border-[#26282E] flex items-center justify-center text-[#38BDF8]">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-mono-sci font-bold text-[#38BDF8] block">
                        {pillar.metric}
                      </span>
                      <span className="text-[9px] uppercase font-mono-sci text-[#9CA3AF]">
                        {pillar.metricLabel}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-editorial text-[#FFFFFF] mb-1">
                      {pillar.title}
                    </h3>
                    <span className="text-[10px] uppercase font-mono-sci text-[#9CA3AF] block mb-2 font-medium">
                      {pillar.subtitle}
                    </span>
                    <p className="text-xs text-[#9CA3AF] leading-relaxed">
                      {pillar.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section id="detective-story" className="gsap-detective-section max-w-7xl mx-auto px-6 scroll-mt-20">
        <div className="space-y-10">
          <div className="gsap-detective-header flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-[#E7E7E4] dark:border-[#26282E]">
            <div className="space-y-2 max-w-2xl">
              <span className="text-[10px] uppercase tracking-mega text-[#0284C7] dark:text-[#38BDF8] font-mono-sci font-bold">
                The Cosmic Detective Story
              </span>
              <h2 className="text-3xl sm:text-5xl font-editorial tracking-tight text-[#111111] dark:text-[#FFFFFF]">
                A Century of Celestial Detective Work
              </h2>
              <p className="text-xs sm:text-sm text-[#555555] dark:text-[#9CA3AF] leading-relaxed">
            How astronomers compare carefully documented observations to study motion and discover new worlds.
              </p>
            </div>
            <div className="text-xs font-mono-sci text-[#8A8A83] dark:text-[#9CA3AF] bg-[#F7F7F5] dark:bg-[#1A1D24] border border-[#E7E7E4] dark:border-[#26282E] px-4 py-2 rounded-sm self-start md:self-auto">
              CADENCE: 6 MONTHS • CHANNELS: 102 NIR
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="gsap-detective-card border-t border-[#E7E7E4] dark:border-[#26282E] pt-5 space-y-4 flex flex-col justify-between transition-colors group">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-sci text-[#737373] dark:text-[#9CA3AF]">
                  <span className="font-bold text-[#111111] dark:text-[#FFFFFF]">ACT I</span>
                  <span>1930 → 2026</span>
                </div>
                <h3 className="text-lg font-editorial text-[#111111] dark:text-[#FFFFFF] group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors">
                  The Pluto Breakthrough
                </h3>
                <p className="text-xs text-[#555555] dark:text-[#9CA3AF] leading-relaxed">
                  Clyde Tombaugh used a blink comparator to compare photographic plates during the search that led to Pluto&apos;s discovery. ORBITAL offers image inspection; its curated reference images do not reproduce that discovery.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E7E7E4] dark:border-[#26282E]">
                <Link
                  href="/compare?obsA=DSS-REF-BARNARD-P1&obsB=DSS-REF-BARNARD-P2"
                  className="inline-flex items-center gap-1.5 text-xs font-mono-sci font-semibold uppercase text-[#111111] dark:text-[#FFFFFF] hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors"
                >
                  <span>Experience The Blink</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="gsap-detective-card border-t border-[#E7E7E4] dark:border-[#26282E] pt-5 space-y-4 flex flex-col justify-between transition-colors group">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-sci text-[#737373] dark:text-[#9CA3AF]">
                  <span className="font-bold text-[#111111] dark:text-[#FFFFFF]">ACT II</span>
                  <span>Challenge target</span>
                </div>
                <h3 className="text-lg font-editorial text-[#111111] dark:text-[#FFFFFF] group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors">
                  A Brown-Dwarf Test Case
                </h3>
                <p className="text-xs text-[#555555] dark:text-[#9CA3AF] leading-relaxed">
                  WISE 0855-0714 is a known Y-type brown dwarf and a challenge test target. The local images here are DSS reference plates; they do not show SPHEREx bands or characterize its atmosphere.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E7E7E4] dark:border-[#26282E]">
                <Link
                  href="/explore?target=WISE%200855-0714"
                  className="inline-flex items-center gap-1.5 text-xs font-mono-sci font-semibold uppercase text-[#111111] dark:text-[#FFFFFF] hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors"
                >
                  <span>Open WISE 0855</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="gsap-detective-card border-t border-[#E7E7E4] dark:border-[#26282E] pt-5 space-y-4 flex flex-col justify-between transition-colors group">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-sci text-[#737373] dark:text-[#9CA3AF]">
                  <span className="font-bold text-[#111111] dark:text-[#FFFFFF]">ACT III</span>
                  <span>Challenge target</span>
                </div>
                <h3 className="text-lg font-editorial text-[#111111] dark:text-[#FFFFFF] group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors">
                  A Moving-Star Test Case
                </h3>
                <p className="text-xs text-[#555555] dark:text-[#9CA3AF] leading-relaxed">
                  Barnard&apos;s Star is a nearby star with substantial cataloged proper motion. The curated images shown here are DSS reference plates, not SPHEREx survey epochs or a measurement of its motion.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E7E7E4] dark:border-[#26282E]">
                <Link
                  href="/explore?target=Barnard%27s%20Star"
                  className="inline-flex items-center gap-1.5 text-xs font-mono-sci font-semibold uppercase text-[#111111] dark:text-[#FFFFFF] hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors"
                >
                  <span>Inspect Reference Images</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="gsap-detective-card border-t border-[#E7E7E4] dark:border-[#26282E] pt-5 space-y-4 flex flex-col justify-between transition-colors group">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-mono-sci text-[#737373] dark:text-[#9CA3AF]">
                  <span className="font-bold text-[#111111] dark:text-[#FFFFFF]">ACT IV</span>
                  <span>Challenge Context</span>
                </div>
                <h3 className="text-lg font-editorial text-[#111111] dark:text-[#FFFFFF] group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors">
                  Planet Nine Is Still Hypothetical
                </h3>
                <p className="text-xs text-[#555555] dark:text-[#9CA3AF] leading-relaxed">
                  Planet Nine remains hypothetical. Finding a distant object would require real observations, suitable image registration, and scientific validation. ORBITAL does not search for or identify Planet Nine.
                </p>
              </div>
              <div className="pt-3 border-t border-[#E7E7E4] dark:border-[#26282E]">
                <Link
                  href="/compare"
                  className="inline-flex items-center gap-1.5 text-xs font-mono-sci font-semibold uppercase text-[#111111] dark:text-[#FFFFFF] hover:text-[#0284C7] dark:hover:text-[#38BDF8] transition-colors"
                >
                  <span>Open Compare Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="gsap-targets-section max-w-7xl mx-auto px-6">
        <div className="gsap-targets-header flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 pb-6 border-b border-[#E7E7E4] dark:border-[#26282E]">
          <div>
            <span className="text-[10px] uppercase tracking-mega text-[#737373] dark:text-[#9CA3AF] font-bold font-mono-sci">Target Catalog</span>
            <h2 className="text-3xl sm:text-4xl font-editorial tracking-tight text-[#111111] dark:text-[#FFFFFF] mt-1">
              Challenge and Additional Targets
            </h2>
          </div>
            <p className="text-xs md:text-sm text-[#555555] dark:text-[#9CA3AF] max-w-md">
            Includes named challenge targets and additional reference objects. Coordinates are search centers; curated image dates are illustrative and the reference plates are not SPHEREx observations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {targets.map((target, idx) => (
            <Link
              key={target.id}
              href={`/explore?target=${encodeURIComponent(target.name)}`}
              data-reveal
              data-reveal-order={idx}
              className={`group border-t border-[#E7E7E4] py-5 transition-transform flex flex-col justify-between dark:border-[#26282E] ${
                idx === 0 ? "lg:col-span-2" : ""
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span className="text-[10px] uppercase tracking-widest font-mono-sci font-semibold text-[#555555] dark:text-[#9CA3AF]">
                    {target.object_type}
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-[#737373] dark:text-[#9CA3AF] group-hover:text-[#111111] dark:group-hover:text-[#FFFFFF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                <h3 className="text-xl font-editorial tracking-tight text-[#111111] dark:text-[#FFFFFF] mb-2 group-hover:text-[#0284C7] dark:group-hover:text-[#38BDF8] transition-colors">
                  {target.name}
                </h3>

                <p className="text-xs text-[#555555] dark:text-[#9CA3AF] leading-relaxed mb-4">
                  {target.description}
                </p>
              </div>

              <div className="pt-4 border-t border-[#E7E7E4] dark:border-[#26282E] space-y-2 text-xs font-mono-sci">
                <div className="flex items-center justify-between text-[#555555] dark:text-[#9CA3AF]">
                  <span>SEARCH CENTER:</span>
                  <span className="text-[#111111] dark:text-[#FFFFFF] font-semibold">RA {target.ra.toFixed(3)}° / Dec {target.dec.toFixed(3)}°</span>
                </div>
                {target.proper_motion && (
                  <div className="flex items-center justify-between text-[#555555] dark:text-[#9CA3AF]">
                    <span>PROPER MOTION:</span>
                    <span className="text-[#0284C7] dark:text-[#38BDF8] font-semibold">{target.proper_motion}</span>
                  </div>
                )}
                <div className="text-[10px] text-[#555555] dark:text-[#9CA3AF] font-medium italic pt-1 leading-normal">
                  Challenge focus: {target.challenge_relevance}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="gsap-cta-section max-w-7xl mx-auto px-6">
        <div className="gsap-cta-content bg-[#101114] text-[#FFFFFF] rounded-sm p-12 md:p-20 text-center relative overflow-hidden shadow-2xl border border-[#26282E]">
          <div className="max-w-2xl mx-auto relative z-10 space-y-6">
            <span className="text-[10px] uppercase tracking-mega text-[#38BDF8] font-mono-sci font-bold">
              Time-Domain Astroinformatics
            </span>
            <h2 className="text-3xl sm:text-5xl font-editorial tracking-tight text-[#FFFFFF] leading-tight">
              LOOK CLOSER.
              <br />
              <span className="italic font-normal">SEE WHAT CHANGES OVER TIME.</span>
            </h2>
            <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed max-w-lg mx-auto">
              Browse released archive records and compare image previews. ORBITAL does not measure motion or variability or identify candidate objects.
            </p>

            <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-8 py-4 bg-[#FFFFFF] text-[#111111] text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-[#E7E7E4] transition-all shadow-md"
              >
                <span>Launch Sky Explorer</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 px-8 py-4 bg-transparent border border-[#26282E] text-[#FFFFFF] text-xs font-semibold uppercase tracking-widest rounded-sm hover:bg-[#26282E] transition-all"
              >
                <span>Mission Specifications</span>
              </Link>
            </div>
          </div>

          <div className="absolute inset-0 bg-grid-dark opacity-30 pointer-events-none" />
        </div>
      </section>
    </main>
  );
}
