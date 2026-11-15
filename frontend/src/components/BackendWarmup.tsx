"use client";

import { useState, useEffect } from "react";
import { AlertCircle, RefreshCw, CheckCircle2, X } from "lucide-react";

export default function BackendWarmup() {
  const [status, setStatus] = useState<"connecting" | "healthy" | "unavailable">("connecting");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then((res) => {
        clearTimeout(timer);
        if (!active) return;
        if (res.ok) {
          setStatus("healthy");
          setTimeout(() => {
            if (active) setDismissed(true);
          }, 2500);
        } else {
          setStatus("unavailable");
        }
      })
      .catch(() => {
        clearTimeout(timer);
        if (!active) return;
        setStatus("unavailable");
      });

    return () => {
      active = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  const handleRetry = () => {
    setStatus("connecting");
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    fetch("/api/health", { cache: "no-store", signal: controller.signal })
      .then((res) => {
        clearTimeout(timer);
        if (res.ok) {
          setStatus("healthy");
          setTimeout(() => setDismissed(true), 2500);
        } else {
          setStatus("unavailable");
        }
      })
      .catch(() => {
        clearTimeout(timer);
        setStatus("unavailable");
      });
  };

  // A connection attempt is routine; avoid covering page content with a toast
  // while the browser is still hydrating or the backend is waking up.
  if (dismissed || status === "connecting") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 right-4 z-50 w-[min(24rem,calc(100vw-2rem))] font-mono-sci text-xs shadow-lg transition-all duration-300 sm:bottom-24 sm:right-6"
    >
      {status === "healthy" && (
        <div className="flex items-center gap-2.5 rounded-sm border border-[#BBF7D0] dark:border-[#15803D]/40 bg-[#F0FDF4]/95 dark:bg-[#14532D]/30 px-3.5 py-2.5 backdrop-blur-md text-[#166534] dark:text-[#86EFAC]">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
          <span>Archive services connected.</span>
        </div>
      )}

      {status === "unavailable" && (
        <div className="flex flex-col gap-2 rounded-sm border border-[#FECACA] dark:border-[#B91C1C]/40 bg-[#FEF2F2]/95 dark:bg-[#7F1D1D]/30 p-3.5 backdrop-blur-md text-[#991B1B] dark:text-[#FCA5A5]">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0 text-[#DC2626]" />
              <span>Backend Unavailable</span>
            </div>
            <button
              onClick={() => setDismissed(true)}
              className="text-[#991B1B] hover:text-[#111111] dark:hover:text-[#FFFFFF]"
              aria-label="Dismiss status notification"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <p className="text-[11px] leading-relaxed text-[#7F1D1D] dark:text-[#F87171]">
            The archive service could not be reached. Live IRSA queries and image analysis may be unavailable. Check the connection and retry.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-sm bg-[#991B1B] px-2.5 py-1 text-[10px] uppercase font-semibold text-[#FFFFFF] hover:bg-[#7F1D1D] transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              <span>Retry Connection</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
