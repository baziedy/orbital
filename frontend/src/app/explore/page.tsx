"use client";

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Search,
  Info,
  Database,
  ArrowRight,
  CheckCircle2,
  RefreshCw,
  Share2,
  HelpCircle,
  Telescope,
  Compass,
  Globe,
  Orbit
} from "lucide-react";
import { searchSky, fetchTargets } from "@/lib/api";
import { ObservationRecord, SearchResponse, TargetInfo } from "@/types";
import ImageViewer from "@/components/ImageViewer";
import ObservationTimeline from "@/components/ObservationTimeline";
import SpectralInspector from "@/components/SpectralInspector";
import AladinSkyAtlas from "@/components/AladinSkyAtlas";
import LightCurveAnalyzer from "@/components/LightCurveAnalyzer";
import PlanetXCalculator from "@/components/PlanetXCalculator";
import SkyGallery from "@/components/SkyGallery";
import StudyNotes from "@/components/StudyNotes";

function ExploreContent() {
  const searchParams = useSearchParams();
  const initialTarget = searchParams.get("target") || "WISE 0855-0714";
  const initialRa = searchParams.get("ra") || "";
  const initialDec = searchParams.get("dec") || "";
  const initialSearchStarted = useRef<boolean>(false);
  const searchRequestIdRef = useRef<number>(0);

  const [targetName, setTargetName] = useState<string>(initialTarget);
  const [raInput, setRaInput] = useState<string>(initialRa);
  const [decInput, setDecInput] = useState<string>(initialDec);
  const radiusInput = 0.01;
  const [demoMode, setDemoMode] = useState<boolean>(searchParams.get("source") === "demo");
  const [workspaceView, setWorkspaceView] = useState<"viewer" | "atlas">(searchParams.get("view") === "atlas" ? "atlas" : "viewer");
  const [selectedBand, setSelectedBand] = useState<string>(searchParams.get("band") || "ALL");

  const [curatedTargets, setCuratedTargets] = useState<TargetInfo[]>([
    {
      id: "wise0855",
      name: "WISE 0855-0714",
      ra: 133.7951,
      dec: -7.2451,
      description: "Named search target. Its curated reference images are not SPHEREx observations.",
      object_type: "Y-type brown dwarf",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Explore this named target; motion is not measured.",
    },
    {
      id: "barnard",
      name: "Barnard's Star",
      ra: 269.45208,
      dec: 4.69339,
      description: "Nearby red dwarf included as a named search target. Curated images do not measure its motion.",
      object_type: "Red dwarf star",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Explore the reference images; motion is not measured.",
    },
    {
      id: "epsindi",
      name: "Epsilon Indi Ba/Bb",
      ra: 331.04415,
      dec: -56.78284,
      description: "Brown-dwarf pair included as a named search target. Curated reference images do not resolve or measure the pair.",
      object_type: "Brown-dwarf pair",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Inspect this named target; binary deblending is not performed.",
    },
    {
      id: "rwaur",
      name: "RW Aurigae",
      ra: 76.95375,
      dec: 30.40111,
      description: "Young stellar system included as a named search target. Curated images do not measure disk changes.",
      object_type: "Young stellar system",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Explore the reference images; variability is not measured.",
    },
    {
      id: "rdra",
      name: "R Draconis",
      ra: 248.3375,
      dec: 66.71194,
      description: "Mira-type variable star included as a named search target. Curated images do not measure its light curve.",
      object_type: "Mira-type variable star",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Explore the reference images; variability is not measured.",
    },
    {
      id: "kapteyn",
      name: "Kapteyn's Star",
      ra: 77.91917,
      dec: -45.01833,
      description: "Additional named search target. Curated images do not measure its motion.",
      object_type: "Nearby star",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Explore the reference images; motion is not measured.",
    },
    {
      id: "wolf359",
      name: "Wolf 359 (CN Leonis)",
      ra: 164.12083,
      dec: 7.01472,
      description: "Nearby red dwarf included as an additional named target. ORBITAL does not identify flares.",
      object_type: "Red dwarf star",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Explore the reference images; flare analysis is not performed.",
    },
    {
      id: "mira",
      name: "Mira (Omicron Ceti)",
      ra: 34.84042,
      dec: -2.97778,
      description: "Mira-type variable star included as an additional named target. Curated images do not measure its light curve.",
      object_type: "Mira-type variable star",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Explore the reference images; variability is not measured.",
    },
    {
      id: "teegarden",
      name: "Teegarden's Star",
      ra: 43.25375,
      dec: 16.88139,
      description: "Nearby red dwarf included as an additional named target. Curated images do not measure its motion.",
      object_type: "Red dwarf star",
      spectral_interest: "Reference context only; this interface does not measure its spectrum.",
      challenge_relevance: "Explore the reference images; motion is not measured.",
    },
  ]);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [selectedObservation, setSelectedObservation] = useState<ObservationRecord | null>(null);
  const [isSearching, setIsSearching] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
  const [shareFailed, setShareFailed] = useState<boolean>(false);
  const [showGuide, setShowGuide] = useState<boolean>(false);
  const [showSkyGallery, setShowSkyGallery] = useState<boolean>(searchParams.get("gallery") === "open");

  useEffect(() => {
    const url = new URL(window.location.href);
    if (targetName.trim()) url.searchParams.set("target", targetName.trim());
    else url.searchParams.delete("target");
    if (raInput.trim()) url.searchParams.set("ra", raInput.trim());
    else url.searchParams.delete("ra");
    if (decInput.trim()) url.searchParams.set("dec", decInput.trim());
    else url.searchParams.delete("dec");
    url.searchParams.set("source", demoMode ? "demo" : "live");
    url.searchParams.set("view", workspaceView);
    if (selectedBand && selectedBand !== "ALL") url.searchParams.set("band", selectedBand);
    else url.searchParams.delete("band");
    if (selectedObservation) url.searchParams.set("obs", selectedObservation.observation_id);
    else url.searchParams.delete("obs");
    if (showSkyGallery) url.searchParams.set("gallery", "open");
    else url.searchParams.delete("gallery");
    window.history.replaceState({}, "", url.toString());
  }, [targetName, raInput, decInput, demoMode, workspaceView, selectedBand, selectedObservation, showSkyGallery]);

  useEffect(() => {
    if (showSkyGallery) {
      document.getElementById("orbital-sky-gallery")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [showSkyGallery]);

  useEffect(() => {
    fetchTargets().then((targets) => {
      if (targets && targets.length > 0) setCuratedTargets(targets);
    }).catch(() => {});
  }, []);

  const handleExecuteSearch = useCallback(async (
    overrideTarget?: string,
    overrideRa?: number,
    overrideDec?: number,
    overrideDemoMode?: boolean
  ) => {
    const currentRequestId = ++searchRequestIdRef.current;
    setIsSearching(true);
    setErrorMessage(null);

    let queryTarget: string | undefined = undefined;
    let queryRa: number | undefined = undefined;
    let queryDec: number | undefined = undefined;
    const queryDemoMode = overrideDemoMode !== undefined ? overrideDemoMode : demoMode;

    if (overrideTarget !== undefined) {
      queryTarget = overrideTarget.trim() !== "" ? overrideTarget.trim() : undefined;
      queryRa = overrideRa;
      queryDec = overrideDec;
    } else if (targetName.trim() !== "") {
      queryTarget = targetName.trim();
      queryRa = undefined;
      queryDec = undefined;
    } else if (raInput.trim() !== "" && decInput.trim() !== "") {
      queryRa = parseFloat(raInput);
      queryDec = parseFloat(decInput);
    }

    try {
      const response = await searchSky({
        target_name: queryTarget,
        ra: queryRa,
        dec: queryDec,
        radius: radiusInput,
        demo_mode: queryDemoMode,
      });

      if (currentRequestId !== searchRequestIdRef.current) return;

      setSearchResults(response);

      if (response.ra !== undefined && response.dec !== undefined) {
        setRaInput(response.ra.toFixed(5));
        setDecInput(response.dec.toFixed(5));
      }

      if (response.observations && response.observations.length > 0) {
        const sharedObservationId = searchParams.get("obs");
        setSelectedObservation(
          response.observations.find((observation) => observation.observation_id === sharedObservationId) || response.observations[0]
        );
      } else {
        setSelectedObservation(null);
      }

      if (typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (queryTarget) url.searchParams.set("target", queryTarget);
        if (response.ra) url.searchParams.set("ra", response.ra.toFixed(5));
        if (response.dec) url.searchParams.set("dec", response.dec.toFixed(5));
        window.history.replaceState({}, "", url.toString());
      }
    } catch (error: unknown) {
      if (currentRequestId !== searchRequestIdRef.current) return;
      setErrorMessage(error instanceof Error ? error.message : "Failed to execute sky search.");
      setSearchResults(null);
      setSelectedObservation(null);
    } finally {
      if (currentRequestId === searchRequestIdRef.current) {
        setIsSearching(false);
      }
    }
  }, [demoMode, targetName, raInput, decInput, radiusInput, searchParams]);

  useEffect(() => {
    if (initialSearchStarted.current) return;
    const timer = window.setTimeout(() => {
      if (initialSearchStarted.current) return;
      initialSearchStarted.current = true;
      if (initialRa && initialDec) {
        void handleExecuteSearch(undefined, parseFloat(initialRa), parseFloat(initialDec));
      } else if (initialTarget) {
        void handleExecuteSearch(initialTarget);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [initialRa, initialDec, initialTarget, handleExecuteSearch]);

  const availableBands = useMemo(() => {
    if (!searchResults?.observations) return [];
    const set = new Set<string>();
    searchResults.observations.forEach((o) => {
      if (o.band) set.add(o.band);
    });
    return Array.from(set);
  }, [searchResults]);

  const filteredObservations = useMemo(() => {
    if (!searchResults?.observations) return [];
    if (selectedBand === "ALL") return searchResults.observations;
    return searchResults.observations.filter((o) => o.band === selectedBand);
  }, [searchResults, selectedBand]);

  const handleSelectCuratedPill = (target: TargetInfo) => {
    setTargetName(target.name);
    setRaInput(target.ra.toFixed(5));
    setDecInput(target.dec.toFixed(5));
    setDemoMode(false);
    handleExecuteSearch(target.name, target.ra, target.dec, false);
  };

  const handleSelectSkyObject = (target: TargetInfo) => {
    setTargetName(target.name);
    setRaInput(target.ra.toFixed(5));
    setDecInput(target.dec.toFixed(5));
    setDemoMode(true);
    void handleExecuteSearch(target.name, target.ra, target.dec, true);
  };

  const handleSwitchToCurated = () => {
    setDemoMode(true);
    handleExecuteSearch(targetName, undefined, undefined, true);
  };

  const handleSwitchToLive = () => {
    setDemoMode(false);
    handleExecuteSearch(targetName, undefined, undefined, false);
  };

  const handleShareLink = async () => {
    let didCopy = false;
    try {
      await navigator.clipboard.writeText(window.location.href);
      didCopy = true;
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      textArea.setAttribute("readonly", "");
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        didCopy = document.execCommand("copy");
      } catch {
        didCopy = false;
      }
      textArea.remove();
    }

    setCopiedUrl(didCopy);
    setShareFailed(!didCopy);
    window.setTimeout(() => {
      setCopiedUrl(false);
      setShareFailed(false);
    }, 2200);
  };

  const isVariableTarget =
    targetName.toLowerCase().includes("draconis") ||
    targetName.toLowerCase().includes("aurigae") ||
    targetName.toLowerCase().includes("mira");

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <div data-reveal className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="text-[10px] uppercase tracking-mega text-[#8A8A83] font-mono-sci">
              ORBITAL Workspace • SPHEREx archive and reference explorer
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-editorial tracking-tight text-[#111111] mt-1">Orbital Sky Explorer</h1>
          <p className="text-xs sm:text-sm text-[#737373] mt-1">
            Explore live archive results and curated DSS reference images. Demo dates and labels are illustrative; image comparisons do not establish motion or variability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className={`flex items-center gap-1.5 px-3 py-1.5 border text-xs font-mono-sci rounded-sm transition-colors ${
              showGuide ? "bg-[#111111] text-[#FFFFFF] border-[#111111]" : "bg-[#FFFFFF] border-[#E7E7E4] text-[#737373] hover:text-[#111111]"
            }`}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Challenge Guide</span>
          </button>

          <button
            onClick={handleShareLink}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] border border-[#E7E7E4] text-[#111111] text-xs font-mono-sci rounded-sm hover:bg-[#F7F7F5] transition-colors"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedUrl ? "Link Copied!" : shareFailed ? "Copy Failed" : "Share Coordinates"}</span>
          </button>

          <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E7E7E4] p-1 rounded-sm text-xs font-mono-sci shadow-sm">
            <span className="text-[#8A8A83] text-[10px] uppercase px-1.5">DATA SOURCE:</span>
            <button
              onClick={handleSwitchToLive}
              className={`px-2.5 py-1 rounded-[2px] transition-all font-medium ${
                !demoMode
                  ? "bg-[#111111] text-[#FFFFFF] shadow-sm"
                  : "text-[#737373] hover:text-[#111111] hover:bg-[#F7F7F5]"
              }`}
            >
              Live NASA IRSA
            </button>
            <button
              onClick={handleSwitchToCurated}
              className={`px-2.5 py-1 rounded-[2px] transition-all font-medium ${
                demoMode
                  ? "bg-[#111111] text-[#FFFFFF] shadow-sm"
                  : "text-[#737373] hover:text-[#111111] hover:bg-[#F7F7F5]"
              }`}
            >
              Curated Reference Images
            </button>
          </div>
        </div>
      </div>

      {showGuide && (
        <div data-reveal className="bg-[#101114] text-[#E5E7EB] border border-[#26282E] rounded-sm p-6 space-y-4 font-mono-sci text-xs shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-[#26282E]">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-[#E5E7EB]" />
              <span className="font-semibold uppercase tracking-wider text-[#FFFFFF] text-sm">
                NASA Space Apps Challenge: How to Test the Benchmark Targets
              </span>
            </div>
            <button
              onClick={() => setShowGuide(false)}
              className="text-[#9CA3AF] hover:text-[#FFFFFF] text-xs uppercase"
            >
              Close ✕
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="border-t border-[#26282E] pt-3 space-y-1">
              <span className="text-[#38BDF8] font-bold block">1. Barnard’s Star</span>
              <p className="text-[11px] text-[#9CA3AF]">
                Use the catalog proper-motion context for Barnard&apos;s Star. Curated images are reference plates and do not demonstrate its motion.
              </p>
            </div>
            <div className="border-t border-[#26282E] pt-3 space-y-1">
              <span className="text-[#38BDF8] font-bold block">2. WISE 0855-0714</span>
              <p className="text-[11px] text-[#9CA3AF]">
                WISE 0855 is a very cold brown dwarf. Spectral curves in the inspector are illustrative, not measured SPHEREx spectra.
              </p>
            </div>
            <div className="border-t border-[#26282E] pt-3 space-y-1">
              <span className="text-[#38BDF8] font-bold block">3. Epsilon Indi Ba/Bb</span>
              <p className="text-[11px] text-[#9CA3AF]">
                Epsilon Indi Ba/Bb is a brown-dwarf pair. The curated reference images do not resolve or measure the pair.
              </p>
            </div>
            <div className="border-t border-[#26282E] pt-3 space-y-1">
              <span className="text-[#38BDF8] font-bold block">4. RW Aurigae</span>
              <p className="text-[11px] text-[#9CA3AF]">
                RW Aur is a variable young stellar system. Curated reference images do not measure its brightness change.
              </p>
            </div>
            <div className="border-t border-[#26282E] pt-3 space-y-1">
              <span className="text-[#38BDF8] font-bold block">5. R Draconis</span>
              <p className="text-[11px] text-[#9CA3AF]">
                R Draconis is a pulsating Mira variable. The curated image sequence does not measure its pulsation amplitude.
              </p>
            </div>
          </div>
        </div>
      )}

      <div data-reveal className="bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-5 sm:p-6 rounded-sm space-y-5 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="md:col-span-5 space-y-1.5">
            <label htmlFor="sky-target-query" className="text-[11px] font-semibold uppercase tracking-wider text-[#111111]">
              Celestial Object Name / Query
            </label>
            <div className="relative flex gap-2">
              <input
                id="sky-target-query"
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                placeholder="e.g. Barnard's Star, WISE 0855, or 08h55m10.8s, -7d14m42.5s"
                className="min-w-0 flex-1 bg-[#F7F7F5] border border-[#E7E7E4] px-3.5 py-2 text-xs text-[#111111] rounded-sm focus:outline-none focus:border-[#111111] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowSkyGallery((open) => !open)}
                aria-expanded={showSkyGallery}
                aria-controls="orbital-sky-gallery"
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-sm border px-3 text-xs font-semibold transition ${showSkyGallery ? "border-[#0284C7] bg-sky-50 text-[#0369A1] dark:bg-[#0C2A3A] dark:text-[#7DD3FC]" : "border-[#E7E7E4] bg-[#FFFFFF] text-[#111111] hover:border-[#0284C7] hover:text-[#0369A1] dark:border-[#26282E] dark:bg-[#12141A] dark:text-[#F3F4F6] dark:hover:text-[#7DD3FC]"}`}
              >
                <Orbit className="h-3.5 w-3.5" />
                <span>{showSkyGallery ? "Hide sky" : "View the sky"}</span>
              </button>
            </div>
          </div>

          <div className="hidden md:flex md:col-span-1 items-center justify-center pb-2 text-[10px] font-mono-sci uppercase text-[#8A8A83]">
            — OR —
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] block">
              RA (Sky Longitude)
            </label>
            <input
              type="text"
              value={raInput}
              onChange={(e) => setRaInput(e.target.value)}
              placeholder="133.795"
              className="w-full bg-[#F7F7F5] border border-[#E7E7E4] px-3.5 py-2 text-xs font-mono-sci text-[#111111] rounded-sm focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          <div className="md:col-span-2 space-y-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-[#111111] block">
              Dec (Sky Latitude)
            </label>
            <input
              type="text"
              value={decInput}
              onChange={(e) => setDecInput(e.target.value)}
              placeholder="-7.245"
              className="w-full bg-[#F7F7F5] border border-[#E7E7E4] px-3.5 py-2 text-xs font-mono-sci text-[#111111] rounded-sm focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <button
              onClick={() => handleExecuteSearch()}
              disabled={isSearching}
              className="w-full py-2 bg-[#111111] text-[#FFFFFF] text-xs font-semibold tracking-widest uppercase rounded-sm hover:bg-[#26282E] transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-sm"
            >
              {isSearching ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Search Sky</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="pt-3 border-t border-[#E7E7E4] flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[10px] uppercase font-mono-sci text-[#8A8A83] mr-1">Reference Targets:</span>
          {curatedTargets.map((target) => {
            const isSelected = targetName.toLowerCase() === target.name.toLowerCase();
            return (
              <button
                key={target.id}
                onClick={() => handleSelectCuratedPill(target)}
                className={`px-3 py-1.5 rounded-sm text-xs transition-all font-mono-sci ${
                  isSelected
                    ? "bg-[#111111] text-[#FFFFFF] font-medium shadow-sm scale-105"
                    : "bg-[#F7F7F5] border border-[#E7E7E4] text-[#737373] hover:text-[#111111] hover:border-[#111111]"
                }`}
              >
                {target.name}
              </button>
            );
          })}
        </div>
      </div>

      <div id="orbital-sky-gallery" className="scroll-mt-24">
        {showSkyGallery && (
          <SkyGallery
            key={`${demoMode ? "demo" : "live"}-${curatedTargets.map((target) => target.id).join("-")}`}
            targets={curatedTargets}
            demoMode={demoMode}
            onSelect={handleSelectSkyObject}
          />
        )}
      </div>

      <div data-reveal className="bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-5 sm:p-6 rounded-sm space-y-3 shadow-sm">
        <div className="flex items-center gap-2">
          <Compass className="w-4 h-4 text-[#111111]" />
          <span className="text-[10px] uppercase font-mono-sci font-bold tracking-widest text-[#8A8A83]">
            Beginner Field Guide: How to Inspect Sky Images in 3 Steps
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs leading-relaxed text-[#555555]">
          <div className="border-t border-[#E7E7E4] pt-3 space-y-1">
            <span className="font-bold text-[#111111] block">Step 1: Pick a Target</span>
            <p className="text-[11px]">
              Choose a target above (start with <strong>Barnard&apos;s Star</strong> or <strong>WISE 0855</strong>).
            </p>
          </div>
          <div className="border-t border-[#E7E7E4] pt-3 space-y-1">
            <span className="font-bold text-[#111111] block">Step 2: Press &quot;Blink Video&quot;</span>
            <p className="text-[11px]">
              Click Blink to cycle through reference images. The displayed sequence dates are illustrative, not the plates&apos; observation dates.
            </p>
          </div>
          <div className="border-t border-[#E7E7E4] pt-3 space-y-1">
              <span className="font-bold text-[#111111] block">Step 3: Place a Review Mark</span>
            <p className="text-[11px]">
              Use the images as a visual comparison aid. They are not registered measurements and do not prove source motion.
            </p>
          </div>
        </div>
      </div>

      <div data-reveal className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-[#E7E7E4]">
        <div className="flex items-center gap-1.5 bg-[#FFFFFF] border border-[#E7E7E4] p-1 rounded-sm text-xs font-mono-sci shadow-sm">
          <button
            onClick={() => setWorkspaceView("viewer")}
            className={`px-3 py-1.5 rounded-[2px] transition-all flex items-center gap-1.5 font-medium ${
              workspaceView === "viewer"
                ? "bg-[#111111] text-[#FFFFFF] shadow-sm"
                : "text-[#737373] hover:text-[#111111]"
            }`}
          >
            <Telescope className="w-3.5 h-3.5" />
            <span>Reference Image Blinker</span>
          </button>
          <button
            onClick={() => setWorkspaceView("atlas")}
            className={`px-3 py-1.5 rounded-[2px] transition-all flex items-center gap-1.5 font-medium ${
              workspaceView === "atlas"
                ? "bg-[#111111] text-[#FFFFFF] shadow-sm"
                : "text-[#737373] hover:text-[#111111]"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>CDS Aladin Interactive Atlas</span>
          </button>
        </div>

        <div className="text-xs font-mono-sci text-[#737373]">
          ACTIVE VIEW: {workspaceView === "viewer" ? "Reference Image Viewer" : "CDS HiPS All-Sky"}
        </div>
      </div>

      {searchResults && (
        <div data-reveal className="border border-[#E7E7E4] dark:border-[#26282E] bg-[#F7F7F5] dark:bg-[#161820] p-4 sm:px-5 rounded-sm text-xs font-mono-sci flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-2.5">
            {searchResults.status === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#111111] dark:text-[#FFFFFF] flex-shrink-0" />
            ) : searchResults.status === "demo_mode" ? (
              <Info className="w-4 h-4 text-[#D97706] flex-shrink-0" />
            ) : (
              <Database className="w-4 h-4 text-[#64748B] flex-shrink-0" />
            )}
            <div>
              <span className="font-semibold uppercase tracking-wider">
                [{searchResults.data_source}]
              </span>{" "}
              {searchResults.message}
            </div>
          </div>

          <div className="text-[11px] text-[#6B7280] self-start md:self-auto">
            COORDINATES: RA {searchResults.ra.toFixed(4)}°, DEC {searchResults.dec.toFixed(4)}° •{" "}
            {searchResults.total_results} OBSERVATIONS RETURNED
          </div>
        </div>
      )}

      {searchResults && !demoMode && searchResults.observations.length === 0 && (
        <div data-reveal className="border border-[#E7E7E4] dark:border-[#26282E] bg-[#F7F7F5] dark:bg-[#161820] p-5 rounded-sm flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-mono-sci shadow-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[#92400E] font-semibold text-sm">
              <Info className="w-4 h-4 text-[#D97706]" />
              <span>
                {searchResults.status === "archive_unavailable"
                  ? "NASA/IPAC IRSA Archive Notice"
                  : "Live NASA/IPAC IRSA SIA Query"}
              </span>
            </div>
            <p className="text-[#92400E] leading-relaxed text-xs">
              {searchResults.status === "archive_unavailable"
                ? searchResults.message || "NASA/IPAC IRSA service is currently unavailable."
                : `NASA/IPAC IRSA returned no public matching records for RA ${searchResults.ra.toFixed(4)}°, DEC ${searchResults.dec.toFixed(4)}°.`}
              {" "}Switch to <strong>Curated Reference Images</strong> to view labeled DSS imagery. Those images are not SPHEREx measurements.
            </p>
          </div>
          <button
            onClick={handleSwitchToCurated}
            className="px-4 py-2 bg-[#111111] text-[#FFFFFF] text-xs uppercase tracking-wider font-semibold rounded-sm hover:bg-[#26282E] transition-all whitespace-nowrap self-start md:self-auto shadow-sm"
          >
            Switch to Curated References →
          </button>
        </div>
      )}

      {errorMessage && (
        <div data-reveal className="p-4 border border-[#FECACA] dark:border-[#EF4444]/40 bg-[#FEF2F2] dark:bg-[#7F1D1D]/20 text-[#991B1B] dark:text-[#FCA5A5] rounded-sm text-xs font-mono-sci">
          <strong>Search Error:</strong> {errorMessage}
        </div>
      )}

      {workspaceView === "atlas" ? (
        <div data-reveal className="space-y-8">
          <AladinSkyAtlas
            key={`${targetName}:${searchResults?.ra ?? 133.7951}:${searchResults?.dec ?? -7.2451}`}
            ra={searchResults?.ra || 133.7951}
            dec={searchResults?.dec || -7.2451}
            targetName={targetName}
          />

          <SpectralInspector
            key={selectedObservation?.target_name || targetName}
            targetName={selectedObservation?.target_name || targetName}
            fluxDensity={selectedObservation?.flux_density}
          />

          {isVariableTarget && (
            <LightCurveAnalyzer targetName={selectedObservation?.target_name || targetName} />
          )}
        </div>
      ) : (
        <div id="sky-viewer-section" data-reveal className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-6">
            <ImageViewer
              observation={selectedObservation}
              observations={searchResults?.observations || []}
              onSelectObservation={(obs) => setSelectedObservation(obs)}
              isLoading={isSearching}
              error={errorMessage}
              statusMessage={searchResults?.message}
              isLiveMode={!demoMode}
              onSwitchToCurated={handleSwitchToCurated}
            />

            {searchResults && searchResults.observations.length > 0 && (
              <ObservationTimeline
                observations={searchResults.observations}
                selectedObservationId={selectedObservation?.observation_id || null}
                onSelectObservation={(obs) => setSelectedObservation(obs)}
              />
            )}

            <SpectralInspector
              key={selectedObservation?.target_name || targetName}
              targetName={selectedObservation?.target_name || targetName}
              fluxDensity={selectedObservation?.flux_density}
            />

            <PlanetXCalculator
              onApplyCoordinates={(ra, dec, name) => handleExecuteSearch(name, ra, dec, false)}
            />

            {isVariableTarget && (
              <LightCurveAnalyzer targetName={selectedObservation?.target_name || targetName} />
            )}
          </div>

          <div className="lg:col-span-4 space-y-6">
            <div data-reveal className="bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-5 rounded-sm space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
                <span className="text-[10px] uppercase tracking-widest font-mono-sci text-[#8A8A83]">Telemetry</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-[2px] font-mono-sci font-semibold border ${
                  selectedObservation
                    ? "bg-[#10B981]/10 text-[#059669] border-[#10B981]/30"
                    : "bg-[#737373]/10 text-[#737373] border-[#737373]/30"
                }`}>
                  {selectedObservation ? selectedObservation.quality_flag : "NO_DATA"}
                </span>
              </div>

              {selectedObservation ? (
                <div className="space-y-3.5 text-xs font-mono-sci">
                  <div>
                    <span className="text-[10px] text-[#737373] uppercase block">Observation ID</span>
                    <span className="text-[#111111] font-semibold text-sm">{selectedObservation.observation_id}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-[#737373] uppercase block">Date (UTC)</span>
                      <span className="text-[#111111]">{selectedObservation.observation_date.slice(0, 10)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-[#737373] uppercase block">Exposure</span>
                      <span className="text-[#111111]">{selectedObservation.exposure_time != null ? `${selectedObservation.exposure_time}s` : "Not provided"}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#737373] uppercase block">Spectral Channel</span>
                    <span className="text-[#0284C7] font-semibold">{selectedObservation.band}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-[#737373] uppercase block">Instrument Payload</span>
                    <span className="text-[#111111]">{selectedObservation.instrument}</span>
                  </div>

                  {selectedObservation.flux_density && (
                    <div>
                      <span className="text-[10px] text-[#737373] uppercase block">Archive Flux Metadata</span>
                      <span className="text-[#111111] font-medium">{selectedObservation.flux_density}</span>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#E7E7E4]">
                    <span className="text-[10px] text-[#737373] uppercase block">Scientific Notes</span>
                    <p className="text-[11px] text-[#737373] leading-relaxed mt-1">
                      {selectedObservation.notes || "Standard all-sky survey co-added spatial frame."}
                    </p>
                  </div>

                  <div className="pt-2">
                    <Link
                      href={`/observation/${encodeURIComponent(selectedObservation.observation_id)}`}
                      className="w-full py-2 bg-[#F7F7F5] border border-[#E7E7E4] text-[#111111] text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-[#E7E7E4] transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Full Observation Sheet</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-[#8A8A83] font-mono-sci space-y-2">
                  <Database className="w-6 h-6 mx-auto text-[#D1D1CB]" />
                  <p>No observation currently selected.</p>
                  <button
                    onClick={handleSwitchToCurated}
                    className="text-[#111111] underline hover:text-[#0284C7]"
                  >
                    Load curated reference images
                  </button>
                </div>
              )}
            </div>

            <div data-reveal className="bg-[#FFFFFF] dark:bg-[#12141A] border border-[#E7E7E4] dark:border-[#26282E] p-5 rounded-sm space-y-4 shadow-sm">
              <div className="flex items-center justify-between pb-3 border-b border-[#E7E7E4]">
                <span className="text-[10px] uppercase tracking-widest font-mono-sci text-[#8A8A83]">Image Sequence</span>
                <span className="text-xs text-[#737373] font-mono-sci">
                  {filteredObservations.length} of {searchResults?.observations?.length || 0} Frames
                </span>
              </div>

              {availableBands.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-[10px] uppercase tracking-wider font-mono-sci text-[#8A8A83]">Band Filter</span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                    <button
                      onClick={() => setSelectedBand("ALL")}
                      className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono-sci transition-colors ${
                        selectedBand === "ALL"
                          ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111]"
                          : "bg-[#F7F7F5] dark:bg-[#161820] border border-[#E7E7E4] dark:border-[#26282E] text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-white"
                      }`}
                    >
                      All Bands ({searchResults?.observations?.length || 0})
                    </button>
                    {availableBands.map((b: string) => {
                      const count = searchResults?.observations?.filter((o) => o.band === b).length || 0;
                      return (
                        <button
                          key={b}
                          onClick={() => setSelectedBand(b)}
                          className={`px-2 py-0.5 rounded-[2px] text-[10px] font-mono-sci transition-colors truncate max-w-[150px] ${
                            selectedBand === b
                              ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111]"
                              : "bg-[#F7F7F5] dark:bg-[#161820] border border-[#E7E7E4] dark:border-[#26282E] text-[#737373] dark:text-[#A1A1AA] hover:text-[#111111] dark:hover:text-white"
                          }`}
                          title={`${b} (${count} frames)`}
                        >
                          {b.replace("Reference plate survey: ", "DSS: ")} ({count})
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                {filteredObservations.length > 0 ? (
                  filteredObservations.map((obs: ObservationRecord, idx: number) => {
                    const isSelected = obs.observation_id === selectedObservation?.observation_id;
                    const firstInBand = filteredObservations[0];
                    const elapsedDays = Math.round(
                      Math.abs(
                        (new Date(obs.observation_date).getTime() - new Date(firstInBand.observation_date).getTime()) /
                          86400000
                      )
                    );
                    const passTag =
                      filteredObservations.length > 1
                        ? `Pass ${idx + 1}${elapsedDays > 0 ? ` (+${elapsedDays}d)` : " (Baseline)"}`
                        : "Single Epoch";

                    return (
                      <button
                        key={obs.observation_id}
                        onClick={() => setSelectedObservation(obs)}
                        className={`w-full text-left p-3 rounded-sm border transition-all text-xs font-mono-sci ${
                          isSelected
                            ? "bg-[#111111] text-[#FFFFFF] border-[#111111] shadow-sm"
                            : "bg-[#F7F7F5] dark:bg-[#161820] border-[#E7E7E4] dark:border-[#26282E] text-[#111111] dark:text-[#FFFFFF] hover:border-[#111111]"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-[11px] truncate max-w-[180px]">{obs.observation_id}</span>
                          <span className={`text-[10px] ${isSelected ? "text-[#38BDF8]" : "text-[#737373] dark:text-[#A1A1AA]"}`}>
                            {obs.observation_date.slice(0, 10)}
                          </span>
                        </div>
                        <div className={`text-[10px] truncate ${isSelected ? "text-[#9CA3AF]" : "text-[#737373]"}`}>
                          {passTag} • {obs.band}
                        </div>
                      </button>
                    );
                  })
                ) : (
                  <div className="py-6 text-center text-xs text-[#8A8A83] font-mono-sci space-y-2">
                    <p>0 observations found for selected band filter.</p>
                    <button
                      onClick={() => setSelectedBand("ALL")}
                      className="text-xs text-[#111111] dark:text-[#FFFFFF] underline"
                    >
                      Reset band filter
                    </button>
                  </div>
                )}
              </div>

              {filteredObservations.length >= 2 ? (
                <div className="pt-2 border-t border-[#E7E7E4]">
                  <Link
                    href={`/compare?obsA=${encodeURIComponent(
                      filteredObservations[0].observation_id
                    )}&obsB=${encodeURIComponent(filteredObservations[1].observation_id)}`}
                    className="w-full py-2 bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-[#26282E] dark:hover:bg-[#E5E7EB] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Compare Same-Band Passes</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : searchResults?.observations && searchResults.observations.length >= 2 ? (
                <div className="pt-2 border-t border-[#E7E7E4]">
                  <Link
                    href={`/compare?obsA=${encodeURIComponent(
                      searchResults.observations[0].observation_id
                    )}&obsB=${encodeURIComponent(searchResults.observations[1].observation_id)}`}
                    className="w-full py-2 bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] text-xs font-medium uppercase tracking-widest rounded-sm hover:bg-[#26282E] dark:hover:bg-[#E5E7EB] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>Compare Frames in Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              ) : null}
            </div>

            <StudyNotes workspace="Explore" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function ExplorePage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-6 py-12 text-center text-xs font-mono-sci">Loading Sky Explorer...</div>}>
      <ExploreContent />
    </Suspense>
  );
}
