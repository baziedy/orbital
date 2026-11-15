"use client";

import { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ObservationRecord, CompareResponse } from "@/types";
import { refreshImageUrl } from "@/lib/api";
import ObservationPreviewImage from "@/components/ObservationPreviewImage";
import {
  Split,
  Columns,
  Layers,
  Play,
  Activity,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Crosshair,
  MapPin,
  Trash2,
  Flame,
  Sun,
  Eye,
  AlertCircle
} from "lucide-react";

interface DiscoveryPin {
  id: number;
  xPct: number;
  yPct: number;
  label: string;
  notes: string;
  timestamp: string;
}

interface ComparisonSliderProps {
  obsA: ObservationRecord;
  obsB: ObservationRecord;
  comparisonResult?: CompareResponse | null;
}

export default function ComparisonSlider({ obsA, obsB, comparisonResult }: ComparisonSliderProps) {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [viewMode, setViewMode] = useState<"slider" | "side" | "diff" | "coadd" | "blink">("slider");

  const [blinkActive, setBlinkActive] = useState<"A" | "B">("A");
  const [blinkSpeedMs, setBlinkSpeedMs] = useState<number>(600);

  const [syncZoom, setSyncZoom] = useState<number>(1);
  const [diffContrast, setDiffContrast] = useState<number>(1);
  const [copiedReport, setCopiedReport] = useState<boolean>(false);

  const [colormap, setColormap] = useState<"normal" | "invert" | "inferno" | "highpass">("normal");

  const [pinningActive, setPinningActive] = useState<boolean>(false);
  const [pins, setPins] = useState<DiscoveryPin[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (viewMode !== "blink") return;
    const interval = setInterval(() => {
      setBlinkActive((prev) => (prev === "A" ? "B" : "A"));
    }, blinkSpeedMs);
    return () => clearInterval(interval);
  }, [viewMode, blinkSpeedMs]);

  useEffect(() => {
    if (viewportRef.current) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        gsap.set(viewportRef.current, { clearProps: "all" });
        return;
      }
      gsap.fromTo(
        viewportRef.current,
        { opacity: 0.85, filter: "brightness(1.08)" },
        { opacity: 1, filter: "brightness(1)", duration: 0.35, ease: "power2.out" }
      );
    }
  }, [viewMode, colormap, blinkActive]);

  const handleViewportClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!pinningActive) return;
    const target = e.currentTarget;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const xPct = Math.round((x / rect.width) * 1000) / 10;
    const yPct = Math.round((y / rect.height) * 1000) / 10;

    const newPin: DiscoveryPin = {
      id: Date.now(),
      xPct,
      yPct,
      label: `REVIEW MARK #${pins.length + 1}`,
      notes: `Visual review mark at canvas position X:${xPct}% Y:${yPct}%; not a source detection.`,
      timestamp: new Date().toISOString(),
    };

    setPins((prev) => [...prev, newPin]);
  };

  const handleRemovePin = (id: number) => {
    setPins((prev) => prev.filter((p) => p.id !== id));
  };

  const isCompatible = comparisonResult ? comparisonResult.is_compatible : true;


  const diffUrl = `/api/diff?obs_a=${encodeURIComponent(obsA.observation_id)}&obs_b=${encodeURIComponent(
    obsB.observation_id
  )}&mode=diff`;

  const coaddUrl = `/api/diff?obs_a=${encodeURIComponent(obsA.observation_id)}&obs_b=${encodeURIComponent(
    obsB.observation_id
  )}&mode=coadd`;

  const getFilterClass = () => {
    switch (colormap) {
      case "invert":
        return "astronomy-filter-invert";
      case "inferno":
        return "astronomy-filter-inferno";
      case "highpass":
        return "astronomy-filter-highpass";
      default:
        return "astronomy-filter-normal";
    }
  };

  const handleExportReport = () => {
    const pinsReport =
      pins.length > 0
        ? pins
            .map(
              (p, idx) =>
                `  [${idx + 1}] ${p.label}: Approximate canvas position X=${p.xPct}%, Y=${p.yPct}% | User-placed review mark, not a detection | Logged: ${p.timestamp}`
            )
            .join("\n")
        : "  No user-placed review marks logged in this session.";

    const reportText = [
      `================================================================================`,
      `ORBITAL DISPLAY PREVIEW COMPARISON REPORT`,
      `Generated: ${new Date().toUTCString()}`,
      `Platform: ORBITAL Planet X and SPHEREx image comparator`,
      `================================================================================`,
      `Target A: ${obsA.target_name} (${obsA.observation_id})`,
      `${obsA.is_demo ? "Illustrative sequence date A" : "Archive observation date A"}: ${obsA.observation_date} | Image type: ${obsA.band} | Flux metadata: ${obsA.flux_density || "N/A"}`,
      `Coordinates A: RA ${obsA.ra.toFixed(5)}°, DEC ${obsA.dec.toFixed(5)}°`,
      `--------------------------------------------------------------------------------`,
      `Target B: ${obsB.target_name} (${obsB.observation_id})`,
      `${obsB.is_demo ? "Illustrative sequence date B" : "Archive observation date B"}: ${obsB.observation_date} | Image type: ${obsB.band} | Flux metadata: ${obsB.flux_density || "N/A"}`,
      `Coordinates B: RA ${obsB.ra.toFixed(5)}°, DEC ${obsB.dec.toFixed(5)}°`,
      `================================================================================`,
      `FIELD-CENTER AND METADATA SUMMARY:`,
      `Temporal Baseline:   ${comparisonResult?.temporal_baseline_days == null ? "Not calculated for curated demo dates" : `${comparisonResult.temporal_baseline_days.toFixed(1)} days`}`,
      `Angular Separation:  ${comparisonResult?.angular_separation_arcsec.toFixed(3) || "N/A"} arcsec`,
      `Supplied Flux Metadata Difference: ${comparisonResult?.flux_differential_pct == null ? "Unavailable" : `${comparisonResult.flux_differential_pct}%`}`,
      `Annualized Field-Center Offset Rate (not source motion): ${
        comparisonResult && comparisonResult.temporal_baseline_days != null && comparisonResult.temporal_baseline_days > 0
          ? (
              comparisonResult.angular_separation_arcsec /
              (comparisonResult.temporal_baseline_days / 365.25)
            ).toFixed(2) + " arcsec/yr"
          : "N/A"
      }`,
      `================================================================================`,
      `USER-PLACED VISUAL REVIEW MARKS:`,
      pinsReport,
      `================================================================================`,
      `DISPLAY LIMITS AND NOTES:`,
      `${comparisonResult?.analysis_summary || "Observations analyzed."}`,
      `================================================================================`,
    ].join("\n");

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ORBITAL_Differential_${obsA.observation_id}_vs_${obsB.observation_id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  return (
    <div className="bg-[#FFFFFF] border border-[#E7E7E4] p-4 sm:p-6 rounded-sm shadow-sm space-y-6 w-full max-w-full min-w-0 overflow-hidden">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <span className="text-[10px] uppercase tracking-mega text-[#8A8A83] font-mono-sci">
            Display Preview Comparison
          </span>
          <h3 className="text-base font-semibold text-[#111111]">Compare Image Previews and Metadata</h3>
        </div>

        <div role="toolbar" aria-label="Comparison modes" className="flex items-center gap-1.5 max-w-full overflow-x-auto p-1 bg-[#F7F7F5] dark:bg-[#161820] border border-[#E7E7E4] dark:border-[#26282E] rounded-sm text-xs font-mono-sci scrollbar-thin">
          <button
            onClick={() => setViewMode("slider")}
            aria-pressed={viewMode === "slider"}
            className={`px-2.5 py-1 rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === "slider" ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111]" : "text-[#737373] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>Split Slider</span>
          </button>

          <button
            onClick={() => setViewMode("side")}
            aria-pressed={viewMode === "side"}
            className={`px-2.5 py-1 rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === "side" ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111]" : "text-[#737373] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setViewMode("diff")}
            aria-pressed={viewMode === "diff"}
            disabled={!isCompatible}
            className={`px-2.5 py-1 rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === "diff"
                ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111]"
                : isCompatible
                ? "text-[#737373] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
                : "text-[#D1D1CB] dark:text-[#525252] cursor-not-allowed"
            }`}
            title={isCompatible ? "View mathematical subtraction (B - A)" : (comparisonResult?.incompatibility_reason || "Difference mode disabled")}
          >
            <Activity className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Display difference (B − A)</span>
          </button>

          <button
            onClick={() => setViewMode("coadd")}
            aria-pressed={viewMode === "coadd"}
            disabled={!isCompatible}
            className={`px-2.5 py-1 rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === "coadd"
                ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111]"
                : isCompatible
                ? "text-[#737373] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
                : "text-[#D1D1CB] dark:text-[#525252] cursor-not-allowed"
            }`}
            title={isCompatible ? "Show arithmetic mean (A + B) / 2" : (comparisonResult?.incompatibility_reason || "Co-add mode disabled")}
          >
            <Layers className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Mean display (A + B) / 2</span>
          </button>

          <button
            onClick={() => setViewMode("blink")}
            aria-pressed={viewMode === "blink"}
            className={`px-2.5 py-1 rounded-[2px] transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
              viewMode === "blink" ? "bg-[#111111] text-[#FFFFFF] dark:bg-[#FFFFFF] dark:text-[#111111]" : "text-[#737373] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
            }`}
            title="Alternate between the two preview images for visual inspection."
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Blink Video</span>
          </button>

          <button
            onClick={handleExportReport}
            className="px-2.5 py-1 border border-[#E7E7E4] dark:border-[#26282E] rounded-[2px] bg-[#FFFFFF] dark:bg-[#12141A] text-[#111111] dark:text-[#FFFFFF] hover:bg-[#F7F7F5] dark:hover:bg-[#1A1D26] transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 ml-1"
            title="Download full differential report text file"
          >
            {copiedReport ? <Check className="w-3 h-3 text-[#10B981]" /> : <Download className="w-3 h-3" />}
            <span>{copiedReport ? "Exported!" : "Export Report"}</span>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#F7F7F5] p-2.5 border border-[#E7E7E4] rounded-sm text-xs font-mono-sci">
        <div className="flex items-center gap-2">
            <span className="text-[#8A8A83] uppercase text-[10px] tracking-wider">Display palette:</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setColormap("normal")}
              className={`px-2 py-1 rounded-[2px] transition-colors ${
                colormap === "normal"
                  ? "bg-[#111111] text-[#FFFFFF]"
                  : "bg-[#FFFFFF] border border-[#E7E7E4] text-[#737373] hover:text-[#111111]"
              }`}
            >
              Standard IR
            </button>
            <button
              onClick={() => setColormap("invert")}
              className={`px-2 py-1 rounded-[2px] transition-colors flex items-center gap-1 ${
                colormap === "invert"
                  ? "bg-[#111111] text-[#FFFFFF]"
                  : "bg-[#FFFFFF] border border-[#E7E7E4] text-[#737373] hover:text-[#111111]"
              }`}
              title="Invert display colors for visual comparison."
            >
              <Eye className="w-3 h-3" />
              <span>Tombaugh Plate (Invert)</span>
            </button>
            <button
              onClick={() => setColormap("inferno")}
              className={`px-2 py-1 rounded-[2px] transition-colors flex items-center gap-1 ${
                colormap === "inferno"
                  ? "bg-[#111111] text-[#FFFFFF]"
                  : "bg-[#FFFFFF] border border-[#E7E7E4] text-[#737373] hover:text-[#111111]"
              }`}
              title="Thermal infrared false-color high dynamic range gradient"
            >
              <Flame className="w-3 h-3 text-[#F97316]" />
              <span>Thermal Inferno</span>
            </button>
            <button
              onClick={() => setColormap("highpass")}
              className={`px-2 py-1 rounded-[2px] transition-colors flex items-center gap-1 ${
                colormap === "highpass"
                  ? "bg-[#111111] text-[#FFFFFF]"
                  : "bg-[#FFFFFF] border border-[#E7E7E4] text-[#737373] hover:text-[#111111]"
              }`}
              title="Apply a high-pass display filter; this does not measure or sharpen a scientific PSF."
            >
              <Sun className="w-3 h-3 text-[#0EA5E9]" />
              <span>High-Pass Sharp</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPinningActive(!pinningActive)}
            className={`px-2.5 py-1 rounded-[2px] flex items-center gap-1.5 transition-all ${
              pinningActive
                ? "bg-[#0284C7] text-[#FFFFFF] shadow-sm animate-pulse"
                : "bg-[#FFFFFF] border border-[#E7E7E4] text-[#111111] hover:border-[#0284C7]"
            }`}
          >
            <Crosshair className="w-3.5 h-3.5" />
            <span>{pinningActive ? "Click Viewport to Mark" : "+ Add Review Mark"}</span>
          </button>
          {pins.length > 0 && (
            <span className="text-[10px] text-[#0284C7] bg-[#E0F2FE] px-2 py-0.5 rounded-full font-semibold">
              {pins.length} logged
            </span>
          )}
        </div>
      </div>

      {viewMode === "slider" && (
        <>
        <div
          ref={containerRef}
          onClick={(e) => { if (pinningActive) handleViewportClick(e); }}
          className={`relative w-full h-[360px] sm:h-[440px] md:h-[520px] bg-[#101114] border border-[#26282E] rounded-sm overflow-hidden select-none shadow-inner ${
            pinningActive ? "cursor-crosshair" : "cursor-ew-resize"
          }`}
        >
          <div className="absolute inset-0 w-full h-full">
            <ObservationPreviewImage
              key={`b:${obsB.observation_id}:${obsB.preview_url}`}
              src={refreshImageUrl(obsB.preview_url)}
              observationId={obsB.observation_id}
              alt={obsB.target_name}
              className={`w-full h-full object-contain ${getFilterClass()}`}
            />

          </div>

          <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2 sm:inset-x-4 sm:top-4">
            <div className="grid min-w-0 max-w-[46%] gap-1 rounded-sm border border-white/[.13] bg-[#0D0F12]/[.88] px-2.5 py-2 text-left shadow-lg backdrop-blur-[10px] sm:px-3">
              <span className="truncate font-mono-sci text-[9px] font-semibold uppercase tracking-wider text-[#F4F6F8] sm:text-[10px]">Observation A</span>
              <strong className="truncate text-xs font-semibold text-[#D7DCE2] sm:text-sm">{obsA.target_name}</strong>
              <span className="truncate font-mono-sci text-[9px] text-[#858D97] sm:text-[10px]">{obsA.is_demo ? "Illustrative reference date" : obsA.observation_date.slice(0, 10)} · {obsA.band}</span>
            </div>
            <div className="grid min-w-0 max-w-[46%] gap-1 rounded-sm border border-white/[.13] bg-[#0D0F12]/[.88] px-2.5 py-2 text-right shadow-lg backdrop-blur-[10px] sm:px-3">
              <span className="truncate font-mono-sci text-[9px] font-semibold uppercase tracking-wider text-[#55C8FF] sm:text-[10px]">Observation B</span>
              <strong className="truncate text-xs font-semibold text-[#D7DCE2] sm:text-sm">{obsB.target_name}</strong>
              <span className="truncate font-mono-sci text-[9px] text-[#858D97] sm:text-[10px]">{obsB.is_demo ? "Illustrative reference date" : obsB.observation_date.slice(0, 10)} · {obsB.band}</span>
            </div>
          </div>

          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
          >
            <ObservationPreviewImage
              key={`a:${obsA.observation_id}:${obsA.preview_url}`}
              src={refreshImageUrl(obsA.preview_url)}
              observationId={obsA.observation_id}
              alt={obsA.target_name}
              className={`w-full h-full object-contain ${getFilterClass()}`}
            />

          </div>

          <div
            className="absolute top-0 bottom-0 w-0.5 bg-[#FFFFFF] flex items-center justify-center pointer-events-none z-20"
            style={{ left: `${sliderPosition}%` }}
          >
            <div
              className="w-8 h-8 rounded-full bg-[#111111] border border-[#FFFFFF] shadow-xl flex items-center justify-center text-[#FFFFFF] text-[10px] font-mono-sci pointer-events-none"
            >
              ↔
            </div>
          </div>

          {!pinningActive && (
            <input type="range" min="0" max="100" step="0.1" value={sliderPosition}
              onChange={(event) => setSliderPosition(Number(event.target.value))}
              aria-label="Drag to compare observations"
              className="absolute inset-0 z-30 h-full w-full cursor-ew-resize opacity-0 touch-none" />
          )}

          {pins.map((p) => (
            <div
              key={p.id}
              className="discovery-pin-container"
              style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
              onClick={(e) => {
                e.stopPropagation();
                handleRemovePin(p.id);
              }}
              title="Click to remove review mark"
            >
              <div className="discovery-reticle">
                <div className="reticle-core" />
                <div className="reticle-ring" />
                <div className="reticle-pulse" />
              </div>
              <div className="discovery-tag">
                {p.label} (× to remove)
              </div>
            </div>
          ))}
        </div>
        </>
      )}

      {viewMode === "side" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono-sci px-1 text-[#737373]">
            <span>Synchronized Spatial Zoom: {syncZoom.toFixed(1)}×</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSyncZoom((prev) => Math.min(prev + 0.25, 3.0))}
                className="p-1 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm hover:border-[#111111]"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSyncZoom((prev) => Math.max(prev - 0.25, 0.75))}
                className="p-1 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm hover:border-[#111111]"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setSyncZoom(1)}
                className="p-1 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm hover:border-[#111111]"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div
            className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${
              pinningActive ? "cursor-crosshair" : ""
            }`}
            onClick={pinningActive ? handleViewportClick : undefined}
          >
            <div className="relative h-[300px] sm:h-[380px] bg-[#101114] border border-[#26282E] rounded-sm overflow-hidden flex items-center justify-center">
              <div className="absolute top-4 left-4 z-10 grid gap-1 bg-[#0D0F12]/[.88] backdrop-blur-[10px] px-3 py-2 border border-white/[.13] rounded-sm text-xs font-mono-sci">
                <span className="text-[#F4F6F8] font-semibold block">Observation A (Image Preview)</span>
                <span className="text-[#D7DCE2] text-[10px] block">{obsA.is_demo ? "Illustrative sequence date" : obsA.observation_date.slice(0, 10)}</span>
                <span className="text-[#858D97] text-[9px] block">{obsA.band}</span>
              </div>
              <ObservationPreviewImage
                src={refreshImageUrl(obsA.preview_url)}
                observationId={obsA.observation_id}
                alt={obsA.target_name}
                className={`w-full h-full object-contain transition-transform duration-150 ${getFilterClass()}`}
                style={{ transform: `scale(${syncZoom})` }}
              />
            </div>

            <div className="relative h-[300px] sm:h-[380px] bg-[#101114] border border-[#26282E] rounded-sm overflow-hidden flex items-center justify-center">
              <div className="absolute top-4 left-4 z-10 grid gap-1 bg-[#0D0F12]/[.88] backdrop-blur-[10px] px-3 py-2 border border-white/[.13] rounded-sm text-xs font-mono-sci">
                <span className="text-[#55C8FF] font-semibold block">Observation B (Image Preview)</span>
                <span className="text-[#D7DCE2] text-[10px] block">{obsB.is_demo ? "Illustrative sequence date" : obsB.observation_date.slice(0, 10)}</span>
                <span className="text-[#858D97] text-[9px] block">{obsB.band}</span>
              </div>
              <ObservationPreviewImage
                src={refreshImageUrl(obsB.preview_url)}
                observationId={obsB.observation_id}
                alt={obsB.target_name}
                className={`w-full h-full object-contain transition-transform duration-150 ${getFilterClass()}`}
                style={{ transform: `scale(${syncZoom})` }}
              />
            </div>
          </div>
        </div>
      )}

      {viewMode === "diff" && !isCompatible && (
        <div className="p-5 bg-[#FFFBEB] dark:bg-[#78350F]/20 border border-[#FDE68A] dark:border-[#B45309]/40 rounded-sm text-xs font-mono-sci space-y-3 text-[#92400E] dark:text-[#FDE68A]">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-[#D97706]" />
            <span>Multi-Band Visual Comparison Active</span>
          </div>
          <p className="leading-relaxed">
            {comparisonResult?.incompatibility_reason || "Mathematical subtraction requires observations from the same spectral band. Visual comparison is active across all multi-band observations."}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => setViewMode("slider")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] rounded-sm hover:bg-[#26282E] transition-colors"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Switch to Split Slider</span>
            </button>
            <button
              onClick={() => setViewMode("blink")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#12141A] border border-[#FDE68A] dark:border-[#B45309]/40 text-[#92400E] dark:text-[#FDE68A] rounded-sm hover:bg-[#FEF3C7] dark:hover:bg-[#78350F]/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Switch to Blink Video</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === "diff" && isCompatible && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono-sci px-1 text-[#737373]">
            <span>Display-Only Raster Subtraction: B − A (Uncalibrated Previews)</span>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] uppercase">Contrast Boost:</span>
              {[1, 2, 4].map((c) => (
                <button
                  key={c}
                  onClick={() => setDiffContrast(c)}
                  className={`px-2 py-0.5 rounded-sm border ${
                    diffContrast === c
                      ? "bg-[#111111] text-[#FFFFFF] border-[#111111]"
                      : "bg-[#F7F7F5] border-[#E7E7E4] text-[#737373]"
                  }`}
                >
                  {c}×
                </button>
              ))}
            </div>
          </div>

          <div
            onClick={pinningActive ? handleViewportClick : undefined}
            className={`relative h-[340px] sm:h-[420px] md:h-[480px] bg-[#101114] border border-[#26282E] rounded-sm overflow-hidden flex items-center justify-center ${
              pinningActive ? "cursor-crosshair" : ""
            }`}
          >
            <div className="absolute top-4 left-4 z-10 bg-[#101114]/85 backdrop-blur-md px-3 py-1.5 border border-[#26282E] rounded-sm text-xs font-mono-sci">
            <span className="text-amber-300 font-semibold block">Display-Only Normalized Raster Difference (B − A)</span>
              <span className="text-[#9CA3AF] text-[10px] block">
                Display-only subtraction for visual inspection. Images are not WCS-aligned or photometrically calibrated; residual artifacts appear and this view does not measure physical source motion or intrinsic brightness variability.
              </span>
            </div>
            <ObservationPreviewImage
              src={refreshImageUrl(diffUrl)}
              fallbackSrc={refreshImageUrl(diffUrl)}
              observationId={`${obsA.observation_id}-diff`}
              alt="Astronomical Difference Array"
              className={`w-full h-full object-cover transition-all ${getFilterClass()}`}
              style={{ filter: `contrast(${diffContrast})` }}
            />

            {pins.map((p) => (
              <div
                key={p.id}
                className="discovery-pin-container"
                style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePin(p.id);
                }}
                title="Click to remove review mark"
              >
                <div className="discovery-reticle">
                  <div className="reticle-core" />
                  <div className="reticle-ring" />
                  <div className="reticle-pulse" />
                </div>
                <div className="discovery-tag">
                  {p.label} (× to remove)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewMode === "coadd" && !isCompatible && (
        <div className="p-5 bg-[#FFFBEB] dark:bg-[#78350F]/20 border border-[#FDE68A] dark:border-[#B45309]/40 rounded-sm text-xs font-mono-sci space-y-3 text-[#92400E] dark:text-[#FDE68A]">
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircle className="w-4 h-4 text-[#D97706]" />
            <span>Mean Display Stacking Reserved for Same-Band Pairs</span>
          </div>
          <p className="leading-relaxed">
            {comparisonResult?.incompatibility_reason || "Stacking requires compatible same-band observations in overlapping sky coordinates."}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              onClick={() => setViewMode("slider")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#111111] dark:bg-[#FFFFFF] text-[#FFFFFF] dark:text-[#111111] rounded-sm hover:bg-[#26282E] transition-colors"
            >
              <Split className="w-3.5 h-3.5" />
              <span>Switch to Split Slider</span>
            </button>
            <button
              onClick={() => setViewMode("blink")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FFFFFF] dark:bg-[#12141A] border border-[#FDE68A] dark:border-[#B45309]/40 text-[#92400E] dark:text-[#FDE68A] rounded-sm hover:bg-[#FEF3C7] dark:hover:bg-[#78350F]/30 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Switch to Blink Video</span>
            </button>
          </div>
        </div>
      )}

      {viewMode === "coadd" && isCompatible && (
        <div
          onClick={pinningActive ? handleViewportClick : undefined}
          className={`relative h-[340px] sm:h-[420px] md:h-[480px] bg-[#101114] border border-[#26282E] rounded-sm overflow-hidden flex items-center justify-center ${
            pinningActive ? "cursor-crosshair" : ""
          }`}
        >
          <div className="absolute top-4 left-4 z-10 bg-[#101114]/85 backdrop-blur-md px-3 py-1.5 border border-[#26282E] rounded-sm text-xs font-mono-sci">
            <span className="text-amber-300 font-semibold block">Mean Display Raster (A + B) / 2</span>
            <span className="text-[#9CA3AF] text-[10px] block">
              Arithmetic mean of two display previews; no exposure stacking or SNR estimate is performed.
            </span>
          </div>
          <ObservationPreviewImage
            src={refreshImageUrl(coaddUrl)}
            fallbackSrc={refreshImageUrl(coaddUrl)}
            observationId={`${obsA.observation_id}-coadd`}
            alt="Co-added Stack"
            className={`w-full h-full object-cover ${getFilterClass()}`}
          />
        </div>
      )}

      {viewMode === "blink" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono-sci px-1 text-[#737373]">
            <span>Blink Comparator Cadence Speed:</span>
            <div className="flex items-center gap-1.5">
              {[
                { label: "0.25s (4 Hz)", ms: 250 },
                { label: "0.5s (2 Hz)", ms: 500 },
                { label: "1.0s (1 Hz)", ms: 1000 },
              ].map((s) => (
                <button
                  key={s.label}
                  onClick={() => setBlinkSpeedMs(s.ms)}
                  className={`px-2 py-0.5 rounded-sm border ${
                    blinkSpeedMs === s.ms
                      ? "bg-[#111111] text-[#FFFFFF] border-[#111111]"
                      : "bg-[#F7F7F5] border-[#E7E7E4] text-[#737373]"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div
            onClick={pinningActive ? handleViewportClick : undefined}
            className={`relative h-[340px] sm:h-[420px] md:h-[480px] bg-[#101114] border border-[#26282E] rounded-sm overflow-hidden flex items-center justify-center ${
              pinningActive ? "cursor-crosshair" : ""
            }`}
          >
            <div className="absolute top-4 left-4 z-10 bg-[#101114]/85 backdrop-blur-md px-3 py-1.5 border border-[#26282E] rounded-sm text-xs font-mono-sci flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#FFFFFF] animate-pulse" />
              <div>
                <span className="text-[#FFFFFF] font-semibold block">
                  Blink Active: Observation {blinkActive}
                </span>
                <span className="text-[#9CA3AF] text-[10px] block">
                  {blinkActive === "A" ? (obsA.is_demo ? "Illustrative date" : obsA.observation_date.slice(0, 10)) : (obsB.is_demo ? "Illustrative date" : obsB.observation_date.slice(0, 10))} •{" "}
                  {blinkActive === "A" ? obsA.band : obsB.band}
                </span>
              </div>
            </div>
            {/* Keep both previews mounted so they load once and the blink never waits on a network request. */}
            <div aria-hidden={blinkActive !== "A"} className={`absolute inset-0 ${blinkActive === "A" ? "opacity-100" : "opacity-0"}`}>
              <ObservationPreviewImage
                key={`blink-a:${obsA.observation_id}:${obsA.preview_url}`}
                src={refreshImageUrl(obsA.preview_url)}
                observationId={obsA.observation_id}
                alt={`${obsA.target_name} blink preview A`}
                className={`w-full h-full object-contain ${getFilterClass()}`}
              />
            </div>
            <div aria-hidden={blinkActive !== "B"} className={`absolute inset-0 ${blinkActive === "B" ? "opacity-100" : "opacity-0"}`}>
              <ObservationPreviewImage
                key={`blink-b:${obsB.observation_id}:${obsB.preview_url}`}
                src={refreshImageUrl(obsB.preview_url)}
                observationId={obsB.observation_id}
                alt={`${obsB.target_name} blink preview B`}
                className={`w-full h-full object-contain ${getFilterClass()}`}
              />
            </div>

            {pins.map((p) => (
              <div
                key={p.id}
                className="discovery-pin-container"
                style={{ left: `${p.xPct}%`, top: `${p.yPct}%` }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePin(p.id);
                }}
                title="Click to remove review mark"
              >
                <div className="discovery-reticle">
                  <div className="reticle-core" />
                  <div className="reticle-ring" />
                  <div className="reticle-pulse" />
                </div>
                <div className="discovery-tag">
                  {p.label} (× to remove)
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pins.length > 0 && (
        <div className="p-4 bg-[#F0F9FF] border border-[#BAE6FD] rounded-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#0284C7]" />
              <h4 className="text-xs uppercase tracking-widest font-semibold text-[#0369A1]">
                Visual Review Marks ({pins.length})
              </h4>
            </div>
            <button
              onClick={() => setPins([])}
              className="text-[11px] text-[#DC2626] hover:underline flex items-center gap-1 font-mono-sci"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {pins.map((p) => (
              <div
                key={p.id}
                className="bg-[#FFFFFF] p-2.5 border border-[#BAE6FD] rounded-sm text-xs font-mono-sci flex items-start justify-between gap-2"
              >
                <div>
                  <span className="font-semibold text-[#0369A1] block">{p.label}</span>
                  <span className="text-[10px] text-[#64748B] block">
                    X: {p.xPct}% • Y: {p.yPct}%
                  </span>
                  <span className="text-[10px] text-[#059669] font-medium block">
                    User-placed visual mark; unverified
                  </span>
                </div>
                <button
                  onClick={() => handleRemovePin(p.id)}
                  className="text-[#94A3B8] hover:text-[#DC2626] p-1"
                  title="Remove"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {comparisonResult && comparisonResult.metrics.length > 0 && (
        <div className="pt-2">
          <h4 className="text-xs uppercase tracking-widest font-semibold text-[#111111] mb-3">
            Differential Metrics
          </h4>
          <div className="overflow-x-auto border border-[#E7E7E4] rounded-sm">
            <table className="w-full text-left text-xs font-mono-sci">
              <thead className="bg-[#F7F7F5] border-b border-[#E7E7E4] text-[#737373]">
                <tr>
                  <th className="py-2.5 px-3 font-medium">Metric</th>
                  <th className="py-2.5 px-3 font-medium">Obs A</th>
                  <th className="py-2.5 px-3 font-medium">Obs B</th>
                  <th className="py-2.5 px-3 font-medium">Differential Delta</th>
                  <th className="py-2.5 px-3 font-medium hidden md:table-cell">
            Metric context and limits
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E7E4] bg-[#FFFFFF]">
                {comparisonResult.metrics.map((m, idx) => (
                  <tr key={idx} className="hover:bg-[#F7F7F5]/50">
                    <td className="py-2.5 px-3 font-semibold text-[#111111]">{m.name}</td>
                    <td className="py-2.5 px-3 text-[#737373]">{m.value_a}</td>
                    <td className="py-2.5 px-3 text-[#737373]">{m.value_b}</td>
                    <td className="py-2.5 px-3 text-amber-700 dark:text-amber-300 font-semibold">{m.delta}</td>
                    <td className="py-2.5 px-3 text-[#8A8A83] hidden md:table-cell text-[11px] leading-relaxed">
                      {m.scientific_significance}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-3 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm text-xs text-[#737373] leading-relaxed">
            <strong className="text-[#111111] font-semibold">Comparison limits: </strong>
            <span>{comparisonResult.analysis_summary}</span>
          </div>
        </div>
      )}
    </div>
  );
}
