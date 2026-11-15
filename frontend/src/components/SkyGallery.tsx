"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Activity, ArrowUpRight, Orbit } from "lucide-react";
import { TargetInfo } from "@/types";

const REFERENCE_FRAMES: Record<string, string[]> = {
  wise_0855: ["wise0855_epoch1.png", "wise0855_epoch2.png", "wise0855_epoch3.png"],
  wise0855: ["wise0855_epoch1.png", "wise0855_epoch2.png", "wise0855_epoch3.png"],
  barnards_star: ["barnard_epoch1.png", "barnard_epoch2.png", "barnard_epoch3.png"],
  barnard: ["barnard_epoch1.png", "barnard_epoch2.png", "barnard_epoch3.png"],
  epsilon_indi: ["epsindi_epoch1.png", "epsindi_epoch2.png"],
  epsindi: ["epsindi_epoch1.png", "epsindi_epoch2.png"],
  rw_aurigae: ["rwaur_epoch1.png", "rwaur_epoch2.png"],
  rwaur: ["rwaur_epoch1.png", "rwaur_epoch2.png"],
  r_draconis: ["rdra_epoch1.png", "rdra_epoch2.png"],
  rdra: ["rdra_epoch1.png", "rdra_epoch2.png"],
  kapteyn: ["kapteyn_epoch1.png", "kapteyn_epoch2.png"],
  wolf_359: ["wolf359_epoch1.png", "wolf359_epoch2.png"],
  wolf359: ["wolf359_epoch1.png", "wolf359_epoch2.png"],
  mira: ["mira_epoch1.png", "mira_epoch2.png"],
  teegarden: ["teegarden_epoch1.png", "teegarden_epoch2.png"],
};

function BlinkReferencePreview({ target, frames }: { target: TargetInfo; frames: string[] }) {
  const sources = frames.map((frame) => `/targets/${frame}`);
  const [activeFrame, setActiveFrame] = useState(0);
  const [loadedFrames, setLoadedFrames] = useState<string[]>([]);
  const [failedFrames, setFailedFrames] = useState<string[]>([]);
  const readyFrames = sources.filter((source) => loadedFrames.includes(source) && !failedFrames.includes(source));

  useEffect(() => {
    if (readyFrames.length < 2) return;
    const timer = window.setInterval(() => setActiveFrame((frame) => (frame + 1) % readyFrames.length), 1100);
    return () => window.clearInterval(timer);
  }, [readyFrames.length]);

  const current = readyFrames[activeFrame % Math.max(readyFrames.length, 1)];

  return (
    <div className="relative aspect-[16/9] overflow-hidden bg-[#101114]">
      {sources.map((source, index) => <Image
        key={source}
        src={source}
        alt={`${target.name} reference frame ${index + 1}`}
        fill
        sizes="(max-width: 768px) 100vw, 50vw"
        unoptimized
        loading="eager"
        onLoad={() => setLoadedFrames((loaded) => loaded.includes(source) ? loaded : [...loaded, source])}
        onError={() => setFailedFrames((failed) => failed.includes(source) ? failed : [...failed, source])}
        className={`object-contain transition-opacity duration-500 ${source === current ? "opacity-100" : "opacity-0"}`}
      />)}
      {sources.every((source) => failedFrames.includes(source)) ? (
        <div className="absolute inset-0 flex items-center justify-center px-5 text-center text-xs text-white/65">
          Reference images are unavailable. Try another object.
        </div>
      ) : !current ? (
        <div role="status" className="absolute inset-0 flex items-center justify-center gap-2 text-xs text-white/70">
          <Activity className="h-4 w-4 animate-pulse"/> Loading reference frames…
        </div>
      ) : null}
      <div className="absolute left-3 top-3 rounded border border-white/15 bg-black/65 px-2 py-1 font-mono-sci text-[9px] text-white backdrop-blur">
        {readyFrames.length > 1 ? `BLINK PREVIEW · FRAME ${activeFrame + 1}/${readyFrames.length}` : "REFERENCE IMAGE · NOT SPHEREX DATA"}
      </div>
      {target.reference_image_credit && (
        <div className="absolute bottom-2 left-2 max-w-[85%] rounded bg-black/65 px-2 py-1 font-mono-sci text-[8px] text-white/75">
          {target.reference_image_credit}
        </div>
      )}
    </div>
  );
}

export default function SkyGallery({ targets, demoMode, onSelect }: { targets: TargetInfo[]; demoMode: boolean; onSelect: (target: TargetInfo) => void }) {
  return (
    <section className="orbital-gallery-enter space-y-5 rounded-sm border border-[#26282E] bg-[#101114] p-4 text-white shadow-xl sm:p-6" aria-label="Available sky objects">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="flex items-center gap-2 font-mono-sci text-[10px] uppercase tracking-[.18em] text-sky-300"><Orbit className="h-3.5 w-3.5"/> Object directory</div><h2 className="mt-1 font-editorial text-2xl">Browse the available sky</h2><p className="mt-1 text-xs text-white/60">Choose an object to load its reference sequence. The preview blinks through the available frames.</p></div>
        <span className="font-mono-sci text-[10px] text-white/60">{demoMode ? "CURATED REFERENCE FRAMES" : "REFERENCE PREVIEWS · OPEN TO EXPLORE"}</span>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {targets.map((target, index) => (
          <article key={target.id} className="orbital-gallery-card overflow-hidden rounded-sm border border-white/10 bg-white/[.04]" style={{ animationDelay: `${index * 70}ms` }}>
            <BlinkReferencePreview target={target} frames={REFERENCE_FRAMES[target.id] || []}/>
            <div className="space-y-3 p-4">
              <div><h3 className="font-editorial text-lg">{target.name}</h3><p className="mt-1 line-clamp-2 text-xs leading-relaxed text-white/60">{target.description}</p></div>
              <div className="flex items-center justify-between gap-2 border-t border-white/10 pt-3 font-mono-sci text-[9px] text-white/60"><span>Curated image sequence</span><span>{target.object_type}</span></div>
              <button type="button" onClick={() => onSelect(target)} className="flex w-full items-center justify-between rounded-sm bg-white px-3 py-2.5 text-xs font-semibold !text-black transition hover:bg-sky-100">Open reference frames<ArrowUpRight className="h-4 w-4 text-black"/></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
