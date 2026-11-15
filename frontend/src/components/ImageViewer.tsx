"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import gsap from "gsap";
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  Minimize2,
  Crosshair,
  Play,
  Pause,
  AlertCircle,
  Activity,
  MapPin,
  Download,
  X,
  Database
} from "lucide-react";
import { ObservationRecord } from "@/types";
import { refreshImageUrl } from "@/lib/api";

interface ImageViewerProps {
  observation?: ObservationRecord | null;
  observations?: ObservationRecord[];
  onSelectObservation?: (obs: ObservationRecord) => void;
  isLoading?: boolean;
  error?: string | null;
  statusMessage?: string | null;
  isLiveMode?: boolean;
  onSwitchToCurated?: () => void;
}

interface DroppedCandidate {
  xPct: number;
  yPct: number;
}

export default function ImageViewer({
  observation,
  observations = [],
  onSelectObservation,
  isLoading = false,
  error = null,
  statusMessage = null,
  isLiveMode = false,
  onSwitchToCurated,
}: ImageViewerProps) {
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hasMovedDrag, setHasMovedDrag] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [blinkSpeedMs, setBlinkSpeedMs] = useState<number>(800);
  const [blinkIndex, setBlinkIndex] = useState<number>(0);

  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [showDiffView, setShowDiffView] = useState<boolean>(false);
  const [failedPreviewUrl, setFailedPreviewUrl] = useState<string | null>(null);
  const [loadedPreviewUrl, setLoadedPreviewUrl] = useState<string | null>(null);
  const [fallbackObservationId, setFallbackObservationId] = useState<string | null>(null);

  const [isPinpointMode, setIsPinpointMode] = useState<boolean>(false);
  const [droppedPin, setDroppedPin] = useState<DroppedCandidate | null>(null);
  const [candidateType, setCandidateType] = useState<string>("Visual Review Mark");
  const candidateNotes = "User-placed visual mark for later review; no source detection or motion measurement is performed.";

  const containerRef = useRef<HTMLDivElement>(null);
  const previewCanvasRef = useRef<HTMLDivElement>(null);
  const imgLayerRef = useRef<HTMLImageElement>(null);
  const observationBand = observation?.band;
  const blinkSequence = useMemo(
    () => isLiveMode && observationBand ? observations.filter((item) => item.band === observationBand) : observations,
    [isLiveMode, observationBand, observations]
  );

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    // React registers wheel handlers as passive in some browsers. A native
    // non-passive listener is needed so preview zoom does not scroll the page.
    const handlePreviewWheel = (event: WheelEvent) => {
      event.preventDefault();
      setZoom((current) => Math.min(4, Math.max(0.4, current * Math.exp(-event.deltaY * 0.0015))));
    };

    canvas.addEventListener("wheel", handlePreviewWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handlePreviewWheel);
  }, [observation?.observation_id, showDiffView]);

  useEffect(() => {
    if (!isBlinking || blinkSequence.length < 2) return;

    const timer = setInterval(() => {
      setBlinkIndex((prev) => {
        const nextIdx = (prev + 1) % blinkSequence.length;
        if (onSelectObservation) {
          onSelectObservation(blinkSequence[nextIdx]);
        }
        return nextIdx;
      });
    }, blinkSpeedMs);

    return () => clearInterval(timer);
  }, [isBlinking, blinkSequence, blinkSpeedMs, onSelectObservation]);

  useEffect(() => {
    if (imgLayerRef.current) {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        imgLayerRef.current.style.opacity = "1";
        return;
      }
      gsap.fromTo(
        imgLayerRef.current,
        { opacity: 0.8 },
        { opacity: 1, duration: 0.25, ease: "power1.out" }
      );
    }
  }, [blinkIndex, showDiffView]);

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.35, 4.0));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.35, 0.4));
  const handleReset = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setHasMovedDrag(false);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setHasMovedDrag(true);
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const activeObs = blinkSequence.length > 0 && isBlinking
    ? blinkSequence[blinkIndex % blinkSequence.length]
    : observation;

  const diffUrl = blinkSequence.length >= 2
    ? `/api/diff?obs_a=${blinkSequence[0].observation_id}&obs_b=${blinkSequence[1].observation_id}&mode=diff`
    : "/api/diff";
  const activeImageUrl = activeObs
    ? refreshImageUrl(showDiffView ? diffUrl : activeObs.preview_url)
    : "";
  const backupImageUrl = activeObs ? refreshImageUrl(`/api/images/${encodeURIComponent(activeObs.observation_id)}`) : "";
  const displayImageUrl = activeObs?.observation_id === fallbackObservationId ? backupImageUrl : activeImageUrl;
  const previewLoadError = failedPreviewUrl === displayImageUrl && displayImageUrl !== "";
  const previewIsLoading = Boolean(displayImageUrl) && loadedPreviewUrl !== displayImageUrl && !previewLoadError;

  useEffect(() => {
    if (!displayImageUrl || loadedPreviewUrl === displayImageUrl || previewLoadError) return;
    const timer = window.setTimeout(() => {
      if (activeObs && activeObs.observation_id !== fallbackObservationId) {
        setFallbackObservationId(activeObs.observation_id);
      } else {
        setFailedPreviewUrl(displayImageUrl);
      }
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [activeObs, displayImageUrl, fallbackObservationId, loadedPreviewUrl, previewLoadError]);

  const toggleBlinking = () => {
    if (!isBlinking && observation) {
      const currentIndex = blinkSequence.findIndex(
        (item) => item.observation_id === observation.observation_id
      );
      if (currentIndex >= 0) setBlinkIndex(currentIndex);
    }
    setIsBlinking((previous) => !previous);
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (hasMovedDrag || !isPinpointMode || !activeObs) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2 - pan.x) / zoom + rect.width / 2;
    const y = (e.clientY - rect.top - rect.height / 2 - pan.y) / zoom + rect.height / 2;
    const xPct = (x / rect.width) * 100;
    const yPct = (y / rect.height) * 100;
    if (xPct < 0 || xPct > 100 || yPct < 0 || yPct > 100) return;

    setDroppedPin({
      xPct,
      yPct,
    });
  };

  const handleExportDiscoveryReport = () => {
    if (!droppedPin || !activeObs) return;

    const dateStr = new Date().toISOString();
    const reportText = `================================================================================
ORBITAL VISUAL REVIEW NOTE
ORBITAL SPHEREx archive viewer
Timestamp: ${dateStr}
================================================================================

1. OBSERVATION CONTEXT
--------------------------------------------------------------------------------
Reference Target Field: ${activeObs.target_name}
Observation Reference ID: ${activeObs.observation_id}
Spectral Band: ${activeObs.band} (${activeObs.wavelength_range})
${activeObs.is_demo ? "Illustrative sequence date" : "Archive observation date"}: ${activeObs.observation_date}
Instrument: ${activeObs.instrument}
Data Source: ${activeObs.data_source}
Focal Plane Resolution: ${activeObs.spatial_resolution_arcsec != null ? `${activeObs.spatial_resolution_arcsec} arcsec/pixel` : "Not provided"}
Display zoom: ${Math.round(zoom * 100)}%

2. USER-PLACED IMAGE REVIEW MARK
--------------------------------------------------------------------------------
Approximate position within displayed preview: X ${droppedPin.xPct.toFixed(2)}%, Y ${droppedPin.yPct.toFixed(2)}%
This position is not a sky coordinate. The preview is not WCS-registered in this interface.

3. USER-ASSIGNED REVIEW LABEL
--------------------------------------------------------------------------------
Review label: ${candidateType}
Observer Diagnostics:
${candidateNotes}

4. DATA PROVENANCE & VALIDATION
--------------------------------------------------------------------------------
Processing Pipeline: ${activeObs.is_demo ? "DSS reference image for display; not calibrated source photometry" : "Custom asinh-stretched FITS display preview; not calibrated source photometry"}
Reference Catalog: No catalog cross-match performed
Status: USER-PLACED VISUAL REVIEW MARK; NOT A SCIENTIFIC DETECTION
Catalog Cross-Match: Not performed

================================================================================
ORBITAL SPHEREx archive exploration
================================================================================`;

    const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ORBITAL_Review_X${droppedPin.xPct.toFixed(1)}_Y${droppedPin.yPct.toFixed(1)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full bg-[#101114] border border-[#26282E] rounded-sm overflow-hidden select-none ${
        isFullscreen ? "h-screen" : "h-[540px] md:h-[620px]"
      } flex items-center justify-center`}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="absolute top-3 left-3 w-4 h-4 border-t border-l border-[#FFFFFF]/30 z-20 pointer-events-none" />
      <div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-[#FFFFFF]/30 z-20 pointer-events-none" />
      <div className="absolute bottom-3 left-3 w-4 h-4 border-b border-l border-[#FFFFFF]/30 z-20 pointer-events-none" />
      <div className="absolute bottom-3 right-3 w-4 h-4 border-b border-r border-[#FFFFFF]/30 z-20 pointer-events-none" />

      {activeObs && (
        <div className="absolute top-4 left-6 right-6 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none text-xs font-mono-sci">
          <div className="flex items-center gap-2">
            <div className="bg-[#101114]/85 backdrop-blur-md px-3 py-1.5 border border-[#26282E] rounded-sm text-[#E5E7EB] flex items-center gap-2.5">
              <span className="text-[#38BDF8] font-medium">{activeObs.target_name}</span>
              <span className="text-[#6B7280]">|</span>
              <span className="text-[#9CA3AF]">{activeObs.band}</span>
              <span className="text-[#6B7280]">|</span>
              <span className="text-[#FBBF24]">
                {activeObs.is_demo
                  ? `Example sequence date ${activeObs.observation_date.slice(0, 10)}`
                  : `Archive observation ${activeObs.observation_date.slice(0, 10)}`}
              </span>
            </div>

            {isBlinking && (
              <div className="bg-white/10 border border-white/25 text-[#FFFFFF] px-2.5 py-1.5 rounded-sm flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]" />
                <span className="text-[11px] font-semibold tracking-wider uppercase">
                  {isLiveMode ? "SAME-BAND BLINK" : "REFERENCE BLINK"} ({blinkIndex + 1}/{blinkSequence.length})
                </span>
              </div>
            )}

            {showDiffView && (
              <div className="bg-[#8B5CF6]/20 border border-[#8B5CF6]/60 text-[#FFFFFF] px-2.5 py-1.5 rounded-sm flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#FFFFFF]" />
                <span className="text-[11px] font-semibold tracking-wider uppercase">
                  DISPLAY-LEVEL DIFFERENCE ACTIVE
                </span>
              </div>
            )}

            {isPinpointMode && (
              <div className="bg-[#0284C7]/20 border border-[#0284C7]/80 text-[#38BDF8] px-2.5 py-1.5 rounded-sm flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-[#38BDF8] transition-colors" />
                <span className="text-[11px] font-semibold tracking-wider uppercase">
                  CLICK CANVAS TO PLACE A REVIEW MARK
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex flex-col items-center gap-3 text-center p-8">
          <div className="w-8 h-8 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono-sci text-[#9CA3AF] tracking-wider uppercase">
            Loading observation preview...
          </span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center gap-3 text-center p-8 max-w-md font-mono-sci">
          <AlertCircle className="w-10 h-10 text-[#EF4444]" />
          <h4 className="text-sm font-semibold text-[#FFFFFF] uppercase tracking-wider">
            Query Error / Connection Timed Out
          </h4>
          <p className="text-xs text-[#9CA3AF] leading-relaxed">{error}</p>
          {onSwitchToCurated && (
            <button
              onClick={onSwitchToCurated}
              className="mt-2 px-3.5 py-2 bg-[#18191E] border border-[#26282E] text-[#38BDF8] hover:text-[#FFFFFF] hover:border-[#38BDF8] text-xs uppercase tracking-wider rounded-sm transition-all"
            >
              Switch to Curated Reference Images →
            </button>
          )}
        </div>
      ) : !activeObs ? (
        <div className="flex flex-col items-center gap-3 text-center p-8 max-w-lg font-mono-sci">
          {isLiveMode || observations.length === 0 ? (
            <>
              <Database className="w-10 h-10 text-[#F59E0B]" />
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#FFFFFF]">
                No Public Observations Found
              </h4>
              <p className="text-xs text-[#9CA3AF] leading-relaxed">
                {statusMessage || "No archive image preview is available at this sky coordinate. Curated DSS reference images are available for selected targets."}
              </p>
              {onSwitchToCurated && (
                <button
                  onClick={onSwitchToCurated}
                  className="mt-2 px-3.5 py-2 bg-[#18191E] border border-[#26282E] text-[#38BDF8] hover:text-[#FFFFFF] hover:border-[#38BDF8] text-xs uppercase tracking-wider rounded-sm transition-all shadow-sm"
                >
                  Switch to Curated Reference Images →
                </button>
              )}
            </>
          ) : (
            <>
              <Crosshair className="w-8 h-8 text-[#6B7280]" />
              <h4 className="text-sm font-semibold uppercase tracking-wider text-[#FFFFFF]">
                Awaiting Target Selection
              </h4>
              <p className="text-xs text-[#6B7280] max-w-sm">
                Select a target above or enter coordinates to search the archive.
              </p>
            </>
          )}
        </div>
      ) : (
        <div
          ref={previewCanvasRef}
          className={`relative w-full h-full flex items-center justify-center overflow-hidden ${
            isPinpointMode ? "cursor-crosshair" : "cursor-grab active:cursor-grabbing"
          }`}
          onMouseDown={handleMouseDown}
          onClick={handleCanvasClick}
        >
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
            className="w-full h-full flex items-center justify-center relative"
          >
            <img
              ref={imgLayerRef}
              key={`${activeObs.observation_id}:${showDiffView}`}
              src={displayImageUrl}
              alt={`${activeObs.target_name} ${activeObs.is_demo ? "DSS reference preview" : "SPHEREx archive preview"}`}
              onError={() => {
                if (activeObs.observation_id !== fallbackObservationId) setFallbackObservationId(activeObs.observation_id);
                else setFailedPreviewUrl(displayImageUrl);
              }}
              onLoad={() => {
                setFailedPreviewUrl(null);
                setLoadedPreviewUrl(displayImageUrl);
              }}
              className="max-h-full max-w-full w-auto h-auto object-contain pointer-events-none select-none"
            />

            {previewIsLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#101114]/70" role="status" aria-live="polite">
                <span className="flex items-center gap-2 rounded-sm border border-white/15 bg-black/70 px-3 py-2 font-mono-sci text-xs text-white/80">
                  <Activity className="h-4 w-4 animate-pulse" aria-hidden="true" />
                  Loading {activeObs.is_demo ? "reference image" : "archive preview"}…
                </span>
              </div>
            )}

            {previewLoadError && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-[#101114]/90 px-6 text-center font-mono-sci">
                <AlertCircle className="h-8 w-8 text-[#F87171]" />
                <p className="text-xs font-semibold uppercase tracking-wider text-[#E5E7EB]">Preview unavailable</p>
                <p className="max-w-md text-[11px] leading-relaxed text-[#9CA3AF]">
                  The archive did not return a display preview. Try another observation or open the source FITS product.
                </p>
              </div>
            )}

            {showReticle && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <svg className="w-28 h-28 overflow-visible" viewBox="0 0 112 112" shapeRendering="geometricPrecision">
                  <circle cx="56" cy="56" r="50" fill="none" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="3 3" opacity="0.65" />
                  <line x1="56" y1="4" x2="56" y2="108" stroke="#FFFFFF" strokeWidth="1" opacity="0.8" />
                  <line x1="4" y1="56" x2="108" y2="56" stroke="#FFFFFF" strokeWidth="1" opacity="0.8" />
                  <circle cx="56" cy="56" r="6" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                  <circle cx="56" cy="56" r="1.5" fill="#FFFFFF" />
                </svg>
              </div>
            )}

            {droppedPin && (
              <div
                className="absolute pointer-events-none flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2"
                style={{ left: `${droppedPin.xPct}%`, top: `${droppedPin.yPct}%` }}
              >
                <div className="w-7 h-7 rounded-full border-2 border-[#38BDF8] flex items-center justify-center animate-celestial-pulse absolute" />
                <div className="w-5 h-5 rounded-full bg-[#38BDF8]/30 border-2 border-[#38BDF8] flex items-center justify-center shadow-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FFFFFF]" />
                </div>
                <div className="mt-1 px-2 py-0.5 bg-[#101114]/90 border border-[#38BDF8] text-[9px] font-mono-sci text-[#38BDF8] rounded-[2px] whitespace-nowrap shadow-md">
                  X {droppedPin.xPct.toFixed(1)}%, Y {droppedPin.yPct.toFixed(1)}%
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {droppedPin && (
        <div className="absolute top-16 right-6 z-30 w-80 bg-[#101114]/95 backdrop-blur-md border border-[#38BDF8]/60 p-4 rounded-sm text-xs font-mono-sci text-[#FFFFFF] shadow-2xl space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-[#26282E]">
            <div className="flex items-center gap-2 text-[#38BDF8]">
              <Crosshair className="w-4 h-4" />
              <span className="font-bold uppercase tracking-wider text-[11px]">Visual Review Mark</span>
            </div>
            <button
              onClick={() => setDroppedPin(null)}
              className="text-[#9CA3AF] hover:text-[#FFFFFF] p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between">
              <span className="text-[#8A8A83]">Preview X:</span>
              <span className="text-[#E5E7EB] font-bold">{droppedPin.xPct.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A8A83]">Preview Y:</span>
              <span className="text-[#E5E7EB] font-bold">{droppedPin.yPct.toFixed(2)}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A8A83]">Sky position:</span>
              <span className="text-[#FBBF24]">Unavailable without WCS</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] uppercase text-[#8A8A83] block">Review label:</span>
            <select
              value={candidateType}
              onChange={(e) => setCandidateType(e.target.value)}
              className="w-full bg-[#18191E] border border-[#26282E] rounded-sm px-2 py-1 text-xs text-[#FFFFFF] focus:outline-none focus:border-[#38BDF8]"
            >
              <option value="Visual Review Mark">Visual Review Mark</option>
              <option value="Area for motion review (unverified)">Area for motion review (unverified)</option>
              <option value="Area for variability review (unverified)">Area for variability review (unverified)</option>
              <option value="Possible display or instrument artifact">Possible display or instrument artifact</option>
              <option value="Other visual note">Other visual note</option>
            </select>
          </div>

          <button
            onClick={handleExportDiscoveryReport}
            className="w-full py-2 bg-[#0284C7] hover:bg-[#0369A1] text-[#FFFFFF] font-bold text-xs uppercase tracking-wider rounded-sm flex items-center justify-center gap-2 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Review Note</span>
          </button>
        </div>
      )}

      {activeObs && (
        <div className="absolute bottom-3 left-3 right-3 sm:bottom-4 sm:left-4 sm:right-4 z-20 flex flex-wrap items-center gap-1.5 text-xs font-mono-sci pointer-events-auto">
          <div className="bg-[#101114]/95 backdrop-blur-md px-2 py-1.5 border border-[#26282E] rounded-sm text-[10px] text-[#9CA3AF] uppercase">
            Zoom {Math.round(zoom * 100)}%
          </div>

          {blinkSequence.length > 1 && (
            <div className="bg-[#101114]/90 backdrop-blur-md p-1 border border-[#26282E] rounded-sm flex items-center gap-1">
              <button
                onClick={toggleBlinking}
                aria-label={isBlinking ? "Pause image blinking" : "Start image blinking"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-xs font-semibold transition-all ${
                  isBlinking
                    ? "bg-[#FFFFFF] text-[#111111] shadow-sm"
                    : "bg-[#26282E] text-[#E5E7EB] hover:bg-[#32353D]"
                }`}
              >
                {isBlinking ? (
                  <>
                    <Pause className="w-3.5 h-3.5 fill-current" />
                    <span>Pause Blink</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>Blink Video</span>
                  </>
                )}
              </button>

              {isBlinking && (
                <div className="flex items-center gap-1 px-1 border-l border-[#374151]">
                  {[
                    { label: "1x", ms: 800 },
                    { label: "2x", ms: 400 },
                    { label: "4x", ms: 200 },
                  ].map((speed) => (
                    <button
                      key={speed.label}
                      onClick={() => setBlinkSpeedMs(speed.ms)}
                        aria-label={`Set blink speed ${speed.label}`}
                      className={`px-1.5 py-0.5 text-[10px] rounded-[2px] transition-colors ${
                        blinkSpeedMs === speed.ms
                          ? "bg-[#38BDF8] text-[#111111] font-bold"
                          : "text-[#9CA3AF] hover:text-[#FFFFFF]"
                      }`}
                    >
                      {speed.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {blinkSequence.length > 1 && (
            <button
              onClick={() => setShowDiffView(!showDiffView)}
                aria-label={showDiffView ? "Show source image" : "Show display difference"}
              className={`p-1.5 border border-[#26282E] rounded-sm transition-colors text-xs flex items-center gap-1.5 ${
                showDiffView
                  ? "bg-[#8B5CF6] text-[#FFFFFF]"
                  : "bg-[#101114]/90 text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[#26282E]"
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>Difference</span>
            </button>
          )}

          {activeObs.fits_url && (
            <a
              href={activeObs.fits_url}
              target="_blank"
              rel="noopener noreferrer"
              title={activeObs.is_demo ? "Open the STScI reference FITS" : "Open the NASA/IPAC IRSA FITS cutout"}
              className="inline-flex items-center gap-1.5 rounded-sm border border-white/20 bg-[#101114]/90 px-2.5 py-1.5 text-[10px] text-[#E5E7EB] hover:border-[#38BDF8] hover:text-[#38BDF8]"
            >
              <Database className="h-3.5 w-3.5" />
              <span>{activeObs.is_demo ? "Source FITS" : "IRSA FITS"}</span>
            </a>
          )}

          <div className="bg-[#101114]/90 backdrop-blur-md p-1 border border-[#26282E] rounded-sm flex items-center gap-1">
            <button
              onClick={() => {
                setIsPinpointMode(!isPinpointMode);
                if (isPinpointMode) setDroppedPin(null);
              }}
              aria-label={isPinpointMode ? "Stop placing review marks" : "Place a visual review mark"}
              className={`px-2 py-1 rounded-sm text-[11px] transition-colors flex items-center gap-1 ${
                isPinpointMode
                  ? "bg-[#38BDF8] text-[#111111] font-semibold"
                  : "text-[#9CA3AF] hover:text-[#FFFFFF] hover:bg-[#26282E]"
              }`}
              title="Place and export a visual review mark without sky coordinates or source detection"
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Place Review Mark</span>
            </button>

            <button
              onClick={() => setShowReticle((prev) => !prev)}
              aria-label={showReticle ? "Hide center reticle" : "Show center reticle"}
              title={showReticle ? "Hide center reticle" : "Show center reticle"}
              className={`p-1 rounded-sm transition-colors ${
                showReticle ? "bg-[#26282E] text-[#0EA5E9]" : "text-[#9CA3AF] hover:bg-[#26282E]"
              }`}
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>

          <div className="bg-[#101114]/90 backdrop-blur-md p-1 border border-[#26282E] rounded-sm flex items-center gap-1 text-[#FFFFFF]">
            <button
              onClick={handleZoomIn}
              aria-label="Zoom in"
              title="Zoom in"
              className="p-1 hover:bg-[#26282E] rounded-sm transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              aria-label="Zoom out"
              title="Zoom out"
              className="p-1 hover:bg-[#26282E] rounded-sm transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleReset}
              aria-label="Reset zoom and pan"
              title="Reset zoom and pan"
              className="p-1 hover:bg-[#26282E] rounded-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <span className="w-[1px] h-4 bg-[#26282E]" />
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="p-1 hover:bg-[#26282E] rounded-sm transition-colors"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
