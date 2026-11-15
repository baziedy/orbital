"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";

interface LightCurvePoint {
  epochIndex: number;
  dateStr: string;
  dayOffset: number;
  phase: number;
  fluxDensity: number;
  magnitude: number;
  band: string;
}

interface LightCurveAnalyzerProps {
  targetName?: string;
}

export default function LightCurveAnalyzer({ targetName = "R Draconis" }: LightCurveAnalyzerProps) {
  const [viewMode, setViewMode] = useState<"time" | "phase">("time");
  const containerRef = useRef<HTMLDivElement>(null);

  const isRDraconis = targetName.toLowerCase().includes("draconis");
  const isMira = targetName.toLowerCase().includes("mira") || targetName.toLowerCase().includes("ceti");
  const isRWAurigae = targetName.toLowerCase().includes("aurigae");

  const periodDays = isRDraconis ? 245.6 : isMira ? 332.0 : null;
  const displayedViewMode = periodDays === null ? "time" : viewMode;

  const lightCurveData = useMemo<LightCurvePoint[]>(() => {
    const points: LightCurvePoint[] = [];
    const totalDays = 730;
    const step = 20;

    const numberOfSteps = Math.ceil(totalDays / step);
    for (let index = 0; index <= numberOfSteps; index++) {
      const day = Math.min(index * step, totalDays);
      const phase = periodDays ? (day % periodDays) / periodDays : 0;
      let flux = 25.0;
      let mag = 10.0;

      if (isRDraconis) {
        const sineVal = Math.sin(phase * 2 * Math.PI - Math.PI / 4);
        flux = 28.0 + 14.0 * sineVal;
        mag = 10.5 - 2.8 * sineVal;
      } else if (isMira) {
        const sineVal = Math.sin(phase * 2 * Math.PI - Math.PI / 2);
        flux = 55.0 + 35.0 * sineVal;
        mag = 6.0 - 4.0 * sineVal;
      } else if (isRWAurigae) {
        const dip = day > 180 && day < 360 ? 0.38 : 0.0;
        flux = (18.2 * (1.0 - dip)) + (Math.sin(day * 0.1) * 0.8);
        mag = 10.4 + dip * 3.2;
      } else {
        flux = 15.0 + Math.sin(day * 0.05) * 0.5;
        mag = 12.0;
      }

      const date = new Date(Date.UTC(2025, 3, 1 + day));
      const dateStr = date.toISOString().slice(0, 10);

      points.push({
        epochIndex: Math.floor(day / 180) + 1,
        dateStr,
        dayOffset: day,
        phase: parseFloat(phase.toFixed(3)),
        fluxDensity: parseFloat(flux.toFixed(2)),
        magnitude: parseFloat(mag.toFixed(2)),
        band: "Band 2 (1.10 - 1.62 µm)",
      });
    }

    return points;
  }, [isRDraconis, isMira, isRWAurigae, periodDays]);

  const peakFlux = Math.max(...lightCurveData.map((p) => p.fluxDensity));
  const minFlux = Math.min(...lightCurveData.map((p) => p.fluxDensity));
  const amplitude = (peakFlux - minFlux).toFixed(1);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".gsap-stat-tile",
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.4, stagger: 0.06, ease: "power2.out", clearProps: "all" }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [targetName]);

  return (
    <div ref={containerRef} className="bg-[#FFFFFF] border border-[#E7E7E4] p-6 rounded-sm shadow-sm space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#E7E7E4]">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-[10px] uppercase tracking-mega font-mono-sci text-[#8A8A83]">
              Illustrative Time-Domain Curve
            </span>
          </div>
          <h3 className="text-xl font-editorial tracking-tight text-[#111111] mt-0.5">
            Example Light Curve
          </h3>
          <p className="text-xs text-[#737373] mt-1">
            This generated curve demonstrates time and phase views. Its dates, values, and period are illustrative and are not measured SPHEREx photometry.
          </p>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F7F7F5] p-1 border border-[#E7E7E4] rounded-sm text-xs font-mono-sci">
          <span className="text-[#8A8A83] text-[10px] uppercase px-1.5">PLOT:</span>
          <button
            onClick={() => setViewMode("time")}
            className={`px-3 py-1 rounded-[2px] transition-all ${
              displayedViewMode === "time" ? "bg-[#111111] text-[#FFFFFF] shadow-sm font-medium" : "text-[#737373] hover:text-[#111111]"
            }`}
          >
            Temporal (2-Year Timeline)
          </button>
          {periodDays !== null && <button
            onClick={() => setViewMode("phase")}
            className={`px-3 py-1 rounded-[2px] transition-all ${
              displayedViewMode === "phase" ? "bg-[#111111] text-[#FFFFFF] shadow-sm font-medium" : "text-[#737373] hover:text-[#111111]"
            }`}
          >
            Phase-Folded (Φ 0.0 – 1.0)
          </button>}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono-sci text-xs">
        <div className="gsap-stat-tile p-3 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm">
          <span className="text-[10px] uppercase text-[#8A8A83] block">Target Variable</span>
          <span className="font-semibold text-sm text-[#111111]">{targetName}</span>
        </div>
        <div className="gsap-stat-tile p-3 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm">
          <span className="text-[10px] uppercase text-[#8A8A83] block">Illustrative Period</span>
          <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">{periodDays === null ? "Not assigned" : `${periodDays} Days`}</span>
        </div>
        <div className="gsap-stat-tile p-3 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm">
          <span className="text-[10px] uppercase text-[#8A8A83] block">Generated Signal Range</span>
          <span className="font-semibold text-sm text-[#111111]">{amplitude} (Δ)</span>
        </div>
        <div className="gsap-stat-tile p-3 bg-[#F7F7F5] border border-[#E7E7E4] rounded-sm">
          <span className="text-[10px] uppercase text-[#8A8A83] block">Peak / Minimum</span>
          <span className="font-semibold text-sm text-amber-700 dark:text-amber-300">{peakFlux} / {minFlux} (relative values)</span>
        </div>
      </div>

      <div className="bg-[#101114] border border-[#26282E] p-4 rounded-sm">
        <div className="flex items-center justify-between text-xs font-mono-sci text-[#9CA3AF] mb-3 pb-2 border-b border-[#26282E]">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-[#FFFFFF] font-semibold uppercase tracking-wider">
              {displayedViewMode === "time" ? "Chronological Flux Evolution" : "Phased Pulsation Folded Curve"}
            </span>
          </div>
          <span className="text-[11px] text-amber-300">Illustrative values; no measured band</span>
        </div>

        <div className="h-[260px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayedViewMode === "phase" ? [...lightCurveData].sort((a, b) => a.phase - b.phase) : lightCurveData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <XAxis
                dataKey={displayedViewMode === "phase" ? "phase" : "dateStr"}
                tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
                stroke="#26282E"
                tickFormatter={(val) => (displayedViewMode === "phase" ? `Φ ${val}` : val.slice(5))}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 10, fontFamily: "monospace" }}
                stroke="#26282E"
                domain={["auto", "auto"]}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const d = payload[0].payload as LightCurvePoint;
                    return (
                      <div className="bg-[#101114] border border-[#26282E] p-2.5 rounded-sm shadow-xl text-xs font-mono-sci space-y-1">
                        <div className="text-amber-300 font-bold">
                          Example point #{d.epochIndex} • {d.dateStr}
                        </div>
                        <div className="text-[#FFFFFF]">
                          Relative signal: <span className="text-amber-700 dark:text-amber-300 font-semibold">{d.fluxDensity}</span>
                        </div>
                        <div className="text-[#9CA3AF]">
                          {displayedViewMode === "phase" && <>Pulsation Phase: <span className="text-amber-300">Φ = {d.phase}</span></>}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="fluxDensity"
                stroke="#F59E0B"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#FBBF24" }}
                activeDot={{ r: 5, fill: "#FFFFFF" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-[#26282E] flex items-center justify-between text-[11px] font-mono-sci text-[#9CA3AF]">
          <span>EXAMPLE TIMING GRID: 20-DAY STEPS</span>
          <span className="text-amber-300">{periodDays === null ? "NO PERIOD ASSIGNED" : `ILLUSTRATIVE FOLD: ${periodDays}d`}</span>
        </div>
      </div>
    </div>
  );
}
