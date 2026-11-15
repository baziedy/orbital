"use client";

import { CSSProperties, useEffect, useState } from "react";
import { Activity, AlertCircle } from "lucide-react";
import { refreshImageUrl } from "@/lib/api";

type Props = {
  src: string;
  observationId: string;
  alt: string;
  className: string;
  style?: CSSProperties;
  fallbackSrc?: string;
  onLoaded?: () => void;
};

/**
 * Shared image recovery for archive and curated previews. Try the supplied URL
 * first; after an error or a 10-second stall, retry via Orbital's image route.
 * Keep this policy centralized so cards, viewer, and Compare recover consistently.
 */
export default function ObservationPreviewImage({ src, observationId, alt, className, style, fallbackSrc, onLoaded }: Props) {
  const backup = fallbackSrc || refreshImageUrl(`/api/images/${encodeURIComponent(observationId)}`);
  const [activeSrc, setActiveSrc] = useState(src);
  const [usedBackup, setUsedBackup] = useState(false);
  const [failed, setFailed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (failed || timedOut || loaded) return;
    const timer = window.setTimeout(() => {
      if (!usedBackup && backup !== src) {
        setUsedBackup(true);
        setActiveSrc(backup);
      } else {
        setTimedOut(true);
        setFailed(true);
      }
    }, 10_000);
    return () => window.clearTimeout(timer);
  }, [activeSrc, backup, failed, loaded, src, timedOut, usedBackup]);

  const recover = () => {
    if (!usedBackup && backup !== src) {
      setUsedBackup(true);
      setActiveSrc(backup);
    } else {
      setFailed(true);
    }
  };

  return <>
    {!failed && <img src={activeSrc} alt={alt} className={className} style={style} onLoad={() => { setLoaded(true); onLoaded?.(); }} onError={recover} />}
    {!failed && activeSrc === backup && <span role="status" className="pointer-events-none absolute inset-x-0 bottom-3 z-40 mx-auto flex w-max items-center gap-2 rounded bg-black/80 px-3 py-2 text-xs text-white shadow"><Activity className="h-4 w-4 animate-pulse"/>Retrying preview…</span>}
    {failed && <span role="alert" className="absolute inset-0 z-40 flex flex-col items-center justify-center gap-2 bg-[#101114]/95 p-5 text-center text-xs text-white/80"><AlertCircle className="h-6 w-6 text-amber-300"/>{timedOut ? "Preview timed out. Try another observation." : "Preview unavailable. Try another observation."}</span>}
  </>;
}
