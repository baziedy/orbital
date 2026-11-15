"use client";

import { useState, useEffect } from "react";
import { Eye, ExternalLink, ZoomIn, ZoomOut, RotateCcw, Crosshair, AlertCircle, Compass, BookOpen } from "lucide-react";

interface AladinSkyAtlasProps {
  ra?: number;
  dec?: number;
  targetName?: string;
}

interface TargetDossier {
  name: string;
  ra: number;
  dec: number;
  fov: number;
  objectType: string;
  storyTitle: string;
  storyNarrative: string;
  opticalSignature: string;
  infraredSignature: string;
  motionVelocity: string;
  surveys: Partial<Record<"frameA" | "frameB" | "frameC" | "frameD", string>>;
}

const TARGET_DOSSIERS: Record<string, TargetDossier> = {
  "WISE 0855-0714": {
    name: "WISE 0855-0714",
    ra: 133.7951,
    dec: -7.2451,
    fov: 0.15,
    objectType: "Sub-Brown Dwarf (Y-type)",
    storyTitle: "The Frigid Ghost of the Solar Neighborhood",
    storyNarrative: "WISE 0855-0714 is a cold Y-type brown dwarf identified in WISE data. It is a known substellar object, not an analogue or detection of a hypothetical distant Solar System planet. The local image examples are photographic references, not WISE or SPHEREx observations.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/wise0855_epoch1.png",
      frameB: "/targets/wise0855_epoch2.png",
      frameC: "/targets/wise0855_epoch1.png",
      frameD: "/targets/wise0855_epoch3.png",
    },
  },
  "Barnard's Star": {
    name: "Barnard's Star",
    ra: 269.45208,
    dec: 4.69339,
    fov: 0.12,
    objectType: "High Proper Motion Red Dwarf (M4.0V)",
    storyTitle: "The Great Celestial Speed Demon",
    storyNarrative: "Barnard's Star is a nearby red dwarf with very high proper motion. The local image examples are not an SPHEREx epoch sequence, and the displayed panels do not measure the star's motion.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/barnard_epoch2.png",
      frameB: "/targets/barnard_epoch1.png",
      frameC: "/targets/barnard_epoch3.png",
      frameD: "/targets/barnard_diff.png",
    },
  },
  "Epsilon Indi Ba/Bb": {
    name: "Epsilon Indi Ba/Bb",
    ra: 331.04415,
    dec: -56.78284,
    fov: 0.15,
    objectType: "Binary Brown Dwarf System (T1 + T6)",
    storyTitle: "The Dancing Twin Giants",
    storyNarrative: "Epsilon Indi Ba/Bb is a nearby brown-dwarf pair associated with the star Epsilon Indi A. This local panel shows photographic reference fields centered on the pair coordinates; it does not resolve a binary orbit or display an infrared spectrum.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/epsindi_epoch1.png",
      frameB: "/targets/epsindi_epoch2.png",
      frameC: "/targets/epsindi_epoch1.png",
      frameD: "/targets/epsindi_epoch2.png",
    },
  },
  "RW Aurigae": {
    name: "RW Aurigae",
    ra: 76.95375,
    dec: 30.40111,
    fov: 0.10,
    objectType: "Classical T Tauri Binary",
    storyTitle: "Cataclysm in a Protoplanetary Nursery",
    storyNarrative: "RW Aurigae is a young stellar system known for variable brightness. These local reference images do not establish a cause for that variability or show a SPHEREx measurement of its disk.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/rwaur_epoch1.png",
      frameB: "/targets/rwaur_epoch2.png",
      frameC: "/targets/rwaur_epoch1.png",
      frameD: "/targets/rwaur_epoch2.png",
    },
  },
  "R Draconis": {
    name: "R Draconis",
    ra: 248.3375,
    dec: 66.71194,
    fov: 0.12,
    objectType: "Mira-type Pulsating Giant (M7e)",
    storyTitle: "The Beating Heart of a Dying Sun",
    storyNarrative: "R Draconis is a Mira-type variable red giant. ORBITAL does not measure its brightness cycle or derive a period from the local reference images.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/rdra_epoch1.png",
      frameB: "/targets/rdra_epoch2.png",
      frameC: "/targets/rdra_epoch1.png",
      frameD: "/targets/rdra_epoch2.png",
    },
  },
  "Kapteyn's Star": {
    name: "Kapteyn's Star",
    ra: 77.91917,
    dec: -45.01833,
    fov: 0.12,
    objectType: "Galactic Halo Subdwarf (M1.0VI)",
    storyTitle: "The Ancient Halo Traveler",
    storyNarrative: "Kapteyn's Star is a nearby high-proper-motion subdwarf. The static reference images here are not a registered multi-epoch series and do not measure its motion.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/kapteyn_epoch2.png",
      frameB: "/targets/kapteyn_epoch1.png",
      frameC: "/targets/kapteyn_epoch1.png",
      frameD: "/targets/kapteyn_epoch2.png",
    },
  },
  "Wolf 359": {
    name: "Wolf 359 (CN Leonis)",
    ra: 164.12083,
    dec: 7.01472,
    fov: 0.12,
    objectType: "Flare Red Dwarf (M6.0V)",
    storyTitle: "The Volatile Neighbor",
    storyNarrative: "Wolf 359 is a nearby flare star. The local reference images do not show a verified flare, and ORBITAL does not measure its brightness changes.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/wolf359_epoch2.png",
      frameB: "/targets/wolf359_epoch1.png",
      frameC: "/targets/wolf359_epoch1.png",
      frameD: "/targets/wolf359_epoch2.png",
    },
  },
  "Mira": {
    name: "Mira (Omicron Ceti)",
    ra: 34.84042,
    dec: -2.97778,
    fov: 0.15,
    objectType: "Pulsating Red Giant (M7 IIIe)",
    storyTitle: "The Wonderful Star of Cetus",
    storyNarrative: "Mira is a well-known pulsating red giant variable star. ORBITAL does not generate a measured light curve or infer variability from these static reference images.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/mira_epoch2.png",
      frameB: "/targets/mira_epoch1.png",
      frameC: "/targets/mira_epoch1.png",
      frameD: "/targets/mira_epoch2.png",
    },
  },
  "Teegarden's Star": {
    name: "Teegarden's Star",
    ra: 43.25375,
    dec: 16.88139,
    fov: 0.12,
    objectType: "Ultra-Cool Red Dwarf (M7.0V)",
    storyTitle: "The Hidden Exoplanet Nursery",
    storyNarrative: "Teegarden's Star is a nearby red dwarf known to host planets. The local image examples show reference fields only; they do not contain an exoplanet measurement or a source-motion analysis.",
    opticalSignature: "The local panel contains DSS reference imagery; it does not provide calibrated optical photometry.",
    infraredSignature: "No infrared spectrum or photometry is shown in this local panel. Use the live IRSA search to check for released SPHEREx products at these coordinates.",
    motionVelocity: "Not measured from these images",
    surveys: {
      frameA: "/targets/teegarden_epoch2.png",
      frameB: "/targets/teegarden_epoch1.png",
      frameC: "/targets/teegarden_epoch1.png",
      frameD: "/targets/teegarden_epoch2.png",
    },
  },
};

export default function AladinSkyAtlas({
  ra = 133.7951,
  dec = -7.2451,
  targetName = "WISE 0855-0714",
}: AladinSkyAtlasProps) {
  const [selectedTargetKey, setSelectedTargetKey] = useState<string>(
    TARGET_DOSSIERS[targetName] ? targetName : ""
  );
  const [atlasMode, setAtlasMode] = useState<"native" | "aladin">("native");
  const [referenceFrame, setReferenceFrame] = useState<"frameA" | "frameB" | "frameC" | "frameD">("frameA");
  const [showReticle, setShowReticle] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [aladinRequestId, setAladinRequestId] = useState<number>(0);
  const [timedOutRequestKey, setTimedOutRequestKey] = useState<string | null>(null);
  const [activeStoryTab, setActiveStoryTab] = useState<"narrative" | "physics">("narrative");

  const aladinRequestKey = `${aladinRequestId}:${selectedTargetKey}`;
  const aladinTimedOut = atlasMode === "aladin" && timedOutRequestKey === aladinRequestKey;

  const selectedDossier = TARGET_DOSSIERS[selectedTargetKey];
  const isCuratedTarget = Boolean(selectedDossier);
  const dossier: TargetDossier = selectedDossier || {
    name: targetName.trim() || "Entered sky coordinates",
    ra,
    dec,
    fov: 0.15,
    objectType: "Custom sky position",
    storyTitle: "Explore a custom sky position",
    storyNarrative: "No curated notes or local reference image are available for this target. Use the external Aladin viewer to inspect its selected sky layer.",
    opticalSignature: "No local reference cutout is assigned to this custom position.",
    infraredSignature: "ORBITAL does not retrieve Aladin survey pixels into its analysis pipeline.",
    motionVelocity: "Not measured by ORBITAL",
    surveys: {},
  };

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    if (atlasMode === "aladin") {
      timer = setTimeout(() => {
        setTimedOutRequestKey(aladinRequestKey);
      }, 7000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [atlasMode, aladinRequestKey]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const currentImageUrl = dossier.surveys[referenceFrame] || dossier.surveys.frameA;
  const availableReferenceFrames = (['frameA', 'frameB', 'frameC', 'frameD'] as const).filter((frame, index, frames) => {
    const imageUrl = dossier.surveys[frame];
    return Boolean(imageUrl) && frames.findIndex((candidate) => dossier.surveys[candidate] === imageUrl) === index;
  });

  const aladinIframeSrc = `https://aladin.cds.unistra.fr/AladinLite/?target=${dossier.ra.toFixed(5)}%20${dossier.dec.toFixed(5)}&fov=${dossier.fov}&survey=P%2FallWISE%2Fcolor`;

  return (
    <div className="bg-[#FFFFFF] border border-[#E7E7E4] rounded-sm shadow-sm overflow-hidden">
      <div className="p-6 border-b border-[#E7E7E4] space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#737373]" />
              <span className="text-[10px] uppercase tracking-mega font-mono-sci text-[#8A8A83] font-semibold">
                Static Image Examples & CDS Aladin
              </span>
            </div>
            <h2 className="text-2xl font-editorial tracking-tight text-[#111111] mt-0.5">
              Static Preview Set and External Sky Atlas
            </h2>
            <p className="text-xs text-[#555555] mt-1 max-w-2xl">
              Select among cached DSS photographic reference images. Barnard&apos;s Star image D is a derived display difference. None are live SPHEREx images. The embedded CDS Aladin viewer loads an AllWISE layer.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#F7F7F5] p-1 border border-[#E7E7E4] rounded-sm">
            <button
              onClick={() => setAtlasMode("native")}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-mono-sci uppercase tracking-wider transition-all ${
                atlasMode === "native"
                  ? "bg-[#111111] text-[#FFFFFF] font-semibold shadow-xs"
                  : "text-[#555555] hover:text-[#111111]"
              }`}
            >
              Static Image Preview
            </button>
            <button
              onClick={() => {
                setAtlasMode("aladin");
                setAladinRequestId((id) => id + 1);
              }}
              className={`px-3 py-1.5 rounded-[2px] text-xs font-mono-sci uppercase tracking-wider transition-all ${
                atlasMode === "aladin"
                  ? "bg-[#111111] text-[#FFFFFF] font-semibold shadow-xs"
                  : "text-[#555555] hover:text-[#111111]"
              }`}
            >
              CDS Aladin Web Embed
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#F7F7F5]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-mono-sci font-bold text-[#8A8A83]">Target Dossier:</span>
            {Object.keys(TARGET_DOSSIERS).map((k) => (
              <button
                key={k}
                onClick={() => {
                  setSelectedTargetKey(k);
                  setReferenceFrame("frameA");
                  handleResetView();
                }}
                className={`px-3 py-1 rounded-sm text-xs font-mono-sci transition-all ${
                  selectedTargetKey === k
                    ? "bg-[#111111] text-[#FFFFFF] font-semibold shadow-xs"
                    : "bg-[#F7F7F5] border border-[#E7E7E4] text-[#555555] hover:text-[#111111] hover:border-[#111111]"
                }`}
              >
                {k}
              </button>
            ))}
          </div>

          {atlasMode === "native" && isCuratedTarget && (
            <div className="flex items-center gap-1.5 bg-[#F7F7F5] p-1 border border-[#E7E7E4] rounded-sm text-xs font-mono-sci">
              <span className="text-[10px] uppercase font-semibold text-[#8A8A83] px-1">REFERENCE IMAGE:</span>
              {availableReferenceFrames.map((frame) => (
                <button
                  key={frame}
                  onClick={() => setReferenceFrame(frame)}
                  className={`px-2 py-0.5 rounded-[2px] ${
                    referenceFrame === frame
                      ? "bg-[#111111] text-[#FFFFFF] font-semibold"
                      : "text-[#555555] hover:text-[#111111]"
                  }`}
                  title={frame === "frameD" && dossier.name === "Barnard's Star"
                    ? "Derived display difference; not a registered scientific measurement"
                    : "Stored DSS reference cutout; not SPHEREx data"}
                  aria-label={`Show reference image ${frame.slice(-1)}`}
                >
                  {frame.slice(-1)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {atlasMode === "native" && isCuratedTarget ? (
        <div className="relative w-full h-[360px] sm:h-[460px] md:h-[520px] bg-[#101114] overflow-hidden select-none cursor-grab active:cursor-grabbing">
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="w-full h-full flex items-center justify-center relative"
          >
            <div
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                transition: isDragging ? "none" : "transform 0.1s ease-out",
              }}
              className="w-full h-full flex items-center justify-center relative"
            >
              {currentImageUrl ? (
                <img
                  src={currentImageUrl}
                  alt={`${dossier.name} DSS reference image ${referenceFrame === "frameA" ? "A" : referenceFrame === "frameB" ? "B" : referenceFrame === "frameC" ? "C" : "D"}`}
                  className="max-w-none w-full h-full object-cover pointer-events-none"
                />
              ) : (
                <div className="flex h-full items-center justify-center px-6 text-center text-sm text-white/70">
                  No local reference image is assigned to this position.
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
                    <text x="56" y="-6" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontFamily="monospace" fontWeight="bold">
                      RA {dossier.ra.toFixed(4)}° / DEC {dossier.dec.toFixed(4)}°
                    </text>
                  </svg>
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-4 left-4 z-20 pointer-events-none bg-[#101114]/85 backdrop-blur-md px-3.5 py-2 border border-[#26282E] rounded-sm text-xs font-mono-sci text-[#FFFFFF] space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#38BDF8]" />
              <span className="font-bold text-sm tracking-wide">{dossier.name}</span>
            </div>
            <div className="text-[10px] text-[#9CA3AF] flex items-center gap-3">
              <span>IMAGE: {referenceFrame === "frameA" ? "A" : referenceFrame === "frameB" ? "B" : referenceFrame === "frameC" ? "C" : "D"}</span>
              <span>TYPE: {dossier.objectType}</span>
            </div>
          </div>

          <div className="absolute bottom-4 left-4 z-20 pointer-events-none bg-[#101114]/85 backdrop-blur-md px-3 py-1.5 border border-[#26282E] rounded-sm text-[10px] font-mono-sci text-[#9CA3AF]">
            <span>STATIC EXAMPLE • NO WCS / GAIA CALIBRATION</span>
          </div>

          <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-[#101114]/90 backdrop-blur-md p-1.5 border border-[#26282E] rounded-sm">
            <button
              onClick={() => setZoom((z) => Math.min(z + 0.25, 3.5))}
              className="p-1.5 text-[#FFFFFF] hover:bg-[#26282E] rounded-sm transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoom((z) => Math.max(z - 0.25, 0.75))}
              className="p-1.5 text-[#FFFFFF] hover:bg-[#26282E] rounded-sm transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetView}
              className="p-1.5 text-[#FFFFFF] hover:bg-[#26282E] rounded-sm transition-colors"
              title="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="w-[1px] h-4 bg-[#26282E] mx-1" />
            <button
              onClick={() => setShowReticle(!showReticle)}
              className={`p-1.5 rounded-sm transition-colors ${
                showReticle ? "bg-[#38BDF8]/20 text-[#38BDF8]" : "text-[#737373] hover:text-[#FFFFFF]"
              }`}
              title="Toggle Reticle"
            >
              <Crosshair className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : atlasMode === "native" ? (
        <div className="flex h-[360px] items-center justify-center bg-[#101114] px-6 text-center text-sm text-white/70 sm:h-[460px] md:h-[520px]">
          No local reference image is available for this position. Switch to the external sky atlas to inspect its selected layer.
        </div>
      ) : (
        <div className="relative w-full h-[360px] sm:h-[460px] md:h-[520px] bg-[#101114]">
          <iframe
            src={aladinIframeSrc}
            title="CDS Aladin Lite Sky Atlas"
            className="w-full h-full border-0"
          />

          {aladinTimedOut && (
            <div className="absolute inset-0 bg-[#101114]/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-30">
              <div className="max-w-md bg-[#1E2028] border border-[#3A3D4D] p-6 rounded-sm shadow-2xl space-y-4">
                <div className="w-10 h-10 rounded-full bg-[#EF4444]/20 border border-[#EF4444]/40 flex items-center justify-center mx-auto text-[#EF4444]">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-editorial font-bold text-[#FFFFFF]">
                    CDS Strasbourg Service Latency
                  </h3>
                  <p className="text-xs text-[#9CA3AF] mt-1.5 leading-relaxed">
                    The external CDS Aladin Lite service is taking longer than expected to respond. You can return to the local reference examples or open Aladin in a separate browser tab.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  <button
                    onClick={() => setAtlasMode("native")}
                    className="w-full sm:w-auto px-4 py-2 bg-[#FFFFFF] text-[#111111] text-xs font-mono-sci font-bold uppercase rounded-sm hover:bg-[#E7E7E4] transition-all"
                  >
                    Return to Image Examples
                  </button>
                  <a
                    href={aladinIframeSrc}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#26282E] text-[#FFFFFF] text-xs font-mono-sci uppercase rounded-sm hover:bg-[#3A3D4D] transition-all"
                  >
                    <span>Open in New Tab</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="p-6 bg-[#F7F7F5] border-t border-[#E7E7E4] space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-sm bg-[#FFFFFF] border border-[#E7E7E4] flex items-center justify-center text-[#111111]">
              <BookOpen className="w-4 h-4 text-[#0284C7]" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-mono-sci font-bold tracking-widest text-[#8A8A83] block">
                Astrophysical Target Dossier & Storytelling
              </span>
              <h3 className="text-lg font-editorial tracking-tight text-[#111111]">
                {dossier.storyTitle}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveStoryTab("narrative")}
              className={`px-3 py-1 rounded-sm text-xs font-mono-sci transition-all ${
                activeStoryTab === "narrative"
                  ? "bg-[#111111] text-[#FFFFFF] font-semibold"
                  : "bg-[#FFFFFF] border border-[#E7E7E4] text-[#555555]"
              }`}
            >
              The Story
            </button>
            <button
              onClick={() => setActiveStoryTab("physics")}
              className={`px-3 py-1 rounded-sm text-xs font-mono-sci transition-all ${
                activeStoryTab === "physics"
                  ? "bg-[#111111] text-[#FFFFFF] font-semibold"
                  : "bg-[#FFFFFF] border border-[#E7E7E4] text-[#555555]"
              }`}
            >
              Wavelength Forensics
            </button>
          </div>
        </div>

        {activeStoryTab === "narrative" ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            <div className="md:col-span-8 space-y-3 text-xs text-[#444444] leading-relaxed">
              <p className="text-sm text-[#111111] font-light leading-relaxed">
                {dossier.storyNarrative}
              </p>
            </div>
            <div className="md:col-span-4 bg-[#FFFFFF] border border-[#E7E7E4] p-4 rounded-sm space-y-3 font-mono-sci text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-[#F7F7F5]">
                <span className="text-[#737373] text-[11px]">Object Class:</span>
                <span className="text-[#111111] font-semibold">{dossier.objectType}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#F7F7F5]">
                <span className="text-[#737373] text-[11px]">Motion status:</span>
                <span className="text-[#0284C7] font-semibold">{dossier.motionVelocity}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#737373] text-[11px]">Coordinates:</span>
                <span className="text-[#111111]">RA {dossier.ra.toFixed(3)}° / Dec {dossier.dec.toFixed(3)}°</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono-sci">
            <div className="bg-[#FFFFFF] border border-[#E7E7E4] p-4 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-[#991B1B]">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase text-[11px]">Local Image Provenance</span>
              </div>
              <p className="text-[#555555] leading-relaxed">
                {dossier.opticalSignature}
              </p>
            </div>

            <div className="bg-[#FFFFFF] border border-[#E7E7E4] p-4 rounded-sm space-y-2">
              <div className="flex items-center gap-2 text-[#0284C7]">
                <Compass className="w-3.5 h-3.5" />
                <span className="font-semibold uppercase text-[11px]">Infrared Data Status</span>
              </div>
              <p className="text-[#555555] leading-relaxed">
                {dossier.infraredSignature}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
